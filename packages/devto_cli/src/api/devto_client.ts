import { z } from 'zod';
import {
	DevtoArticleListSchema,
	DevtoArticleSchema,
	DevtoUserSchema,
} from './devto_types.js';
import type {
	DevtoArticle,
	DevtoArticleFilter,
	DevtoArticleInput,
	DevtoUser,
} from './devto_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoClient — sends the requests of the dev.to API with the API key
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The function that sends one request, with the same shape as the global `fetch`.
 */
export type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

/**
 * The options of a `DevtoClient`.
 */
export type DevtoClientOptions = {
	/** The dev.to API key. */
	apiKey: string;
	/** The address of the API. The default is `https://dev.to/api`. */
	baseUrl?: string;
	/** The function that sends each request. The default is the global `fetch`. */
	fetchFn?: FetchFn;
};

/**
 * A client of the dev.to API.
 */
export class DevtoClient {
	/** The dev.to API key. */
	private readonly _apiKey: string;
	/** The address of the API, without a final `/`. */
	private readonly _baseUrl: string;
	/** The function that sends each request. */
	private readonly _fetchFn: FetchFn;

	/**
	 * @param options The options of the client.
	 */
	constructor(options: DevtoClientOptions) {
		this._apiKey = options.apiKey;
		this._baseUrl = (options.baseUrl ?? 'https://dev.to/api').replace(/\/$/, '');
		this._fetchFn = options.fetchFn ?? fetch;
	}

	/**
	 * Read the user that owns the API key.
	 *
	 * @returns The user.
	 */
	async getMe(): Promise<DevtoUser> {
		return await this._request('GET', '/users/me', undefined, DevtoUserSchema);
	}

	/**
	 * Create an article. Without `published` and without `publishedAt`, the article is a draft.
	 *
	 * @param input The values of the article.
	 * @returns The created article.
	 */
	async createArticle(input: DevtoArticleInput): Promise<DevtoArticle> {
		const body = DevtoClient._toArticleBody({
			published: false,
			...input,
		});
		return await this._request('POST', '/articles', body, DevtoArticleSchema);
	}

	/**
	 * Update an article of the user.
	 *
	 * @param articleId The identifier of the article.
	 * @param input The values to change.
	 * @returns The updated article.
	 */
	async updateArticle(articleId: number, input: DevtoArticleInput): Promise<DevtoArticle> {
		const body = DevtoClient._toArticleBody(input);
		return await this._request('PUT', `/articles/${articleId}`, body, DevtoArticleSchema);
	}

	/**
	 * List the articles of the user.
	 *
	 * @param filter Which articles to list.
	 * @param page The page number, from 1.
	 * @param perPage The number of articles on each page.
	 * @returns The articles.
	 */
	async listMyArticles(filter: DevtoArticleFilter, page: number, perPage: number): Promise<DevtoArticle[]> {
		const params = new URLSearchParams({
			page: String(page),
			per_page: String(perPage),
		});
		const path = `/articles/me/${filter}?${params.toString()}`;
		return await this._request('GET', path, undefined, DevtoArticleListSchema);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Send one request, and check the response with a schema.
	 *
	 * @param method The HTTP method.
	 * @param path The path, from the address of the API.
	 * @param body The body to send as JSON, or undefined.
	 * @param schema The schema of the response.
	 * @returns The checked response.
	 */
	private async _request<T>(method: string, path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
		const headers: Record<string, string> = {
			'api-key': this._apiKey,
			'accept': 'application/vnd.forem.api-v1+json',
			'user-agent': 'devto_cli',
		};
		const init: RequestInit = {
			method,
			headers,
		};
		if (body !== undefined) {
			headers['content-type'] = 'application/json';
			init.body = JSON.stringify(body);
		}

		const response = await this._fetchFn(`${this._baseUrl}${path}`, init);
		const text = await response.text();
		if (response.ok === false) {
			throw new Error(`dev.to API error ${response.status} on ${method} ${path}: ${text}`);
		}
		return schema.parse(JSON.parse(text));
	}

	/**
	 * Change the values of an article into the body that the dev.to API expects.
	 *
	 * @param input The values of the article.
	 * @returns The body of the request.
	 */
	private static _toArticleBody(input: DevtoArticleInput): { article: Record<string, unknown> } {
		const published = input.publishedAt !== undefined ? true : input.published;
		const article: Record<string, unknown> = {
			title: input.title,
			body_markdown: input.bodyMarkdown,
			published,
			published_at: input.publishedAt,
			main_image: input.coverImageUrl,
			tags: input.tags,
			description: input.description,
			canonical_url: input.canonicalUrl,
			series: input.series,
		};
		for (const key of Object.keys(article)) {
			if (article[key] === undefined) {
				delete article[key];
			}
		}
		return {
			article,
		};
	}
}
