import { z } from 'zod';
import { DevtoApiError } from './devto_api_error.js';
import {
	DevtoAnalyticsDailySchema,
	DevtoAnalyticsReferrersSchema,
	DevtoAnalyticsTotalsSchema,
	DevtoCommentListSchema,
	DevtoCommentSchema,
} from './devto_engagement_types.js';
import type {
	DevtoAnalyticsDaily,
	DevtoAnalyticsQuery,
	DevtoAnalyticsReferrers,
	DevtoAnalyticsTotals,
	DevtoComment,
} from './devto_engagement_types.js';
import {
	DevtoArticleListSchema,
	DevtoArticlePreviewSchema,
	DevtoArticleSchema,
	DevtoImageSchema,
	DevtoUserSchema,
} from './devto_types.js';
import type {
	DevtoArticle,
	DevtoArticleFilter,
	DevtoArticleInput,
	DevtoArticlePreview,
	DevtoImage,
	DevtoPage,
	DevtoPublishedArticleQuery,
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
 * The function that waits, so that a test can wait no time.
 */
export type SleepFn = (milliseconds: number) => Promise<void>;

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
	/** The function that waits before a retry. The default waits with `setTimeout`. */
	sleepFn?: SleepFn;
	/** The number of retries after an answer 429 (too many requests). The default is 3. */
	maxRetries?: number;
};

/**
 * The query parameters of a request. An undefined value is not sent.
 */
type QueryParams = Record<string, string | number | undefined>;

/**
 * The largest page of the list of the articles of the user.
 */
const MAX_PER_PAGE = 1000;

/**
 * The wait before the first retry, in milliseconds, when the answer 429 gives no `retry-after` header.
 */
const DEFAULT_RETRY_DELAY = 5000;

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
	/** The function that waits before a retry. */
	private readonly _sleepFn: SleepFn;
	/** The number of retries after an answer 429. */
	private readonly _maxRetries: number;

	/**
	 * @param options The options of the client.
	 */
	constructor(options: DevtoClientOptions) {
		this._apiKey = options.apiKey;
		this._baseUrl = (options.baseUrl ?? 'https://dev.to/api').replace(/\/$/, '');
		this._fetchFn = options.fetchFn ?? fetch;
		this._sleepFn = options.sleepFn ?? (async (milliseconds: number) => {
			await new Promise((resolve) => {
				setTimeout(resolve, milliseconds);
			});
		});
		this._maxRetries = options.maxRetries ?? 3;
	}

	/**
	 * Read the user that owns the API key.
	 *
	 * @returns The user.
	 */
	async getMe(): Promise<DevtoUser> {
		return await this._request('GET', '/users/me', undefined, DevtoUserSchema);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Articles
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

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
	 * Read one article. A published article comes from `GET /articles/{id}`; a draft of the user comes from the
	 * list of the articles of the user, because `GET /articles/{id}` answers 404 for a draft.
	 *
	 * @param articleId The identifier of the article.
	 * @returns The article.
	 */
	async getArticle(articleId: number): Promise<DevtoArticle> {
		try {
			return await this._request('GET', `/articles/${articleId}`, undefined, DevtoArticleSchema);
		} catch (error) {
			if ((error instanceof DevtoApiError && error.status === 404) === false) {
				throw error;
			}
		}

		for (let page = 1; ; page++) {
			const articles = await this.listMyArticles('all', page, MAX_PER_PAGE);
			const article = articles.find((oneArticle) => oneArticle.id === articleId);
			if (article !== undefined) {
				return article;
			}
			if (articles.length < MAX_PER_PAGE) {
				throw new Error(`No article with the identifier ${articleId}.`);
			}
		}
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
		const path = DevtoClient._withQuery(`/articles/me/${filter}`, {
			page,
			per_page: perPage,
		});
		return await this._request('GET', path, undefined, DevtoArticleListSchema);
	}

	/**
	 * List the published articles of all the users, with filters.
	 *
	 * @param query The filters and the page.
	 * @returns The articles.
	 */
	async listPublishedArticles(query: DevtoPublishedArticleQuery): Promise<DevtoArticle[]> {
		const path = DevtoClient._withQuery('/articles', {
			tag: query.tag,
			username: query.username,
			top: query.top,
			page: query.page,
			per_page: query.perPage,
		});
		return await this._request('GET', path, undefined, DevtoArticleListSchema);
	}

	/**
	 * Show the HTML of an article without saving the article.
	 *
	 * @param input The values of the article.
	 * @returns The preview.
	 */
	async previewArticle(input: DevtoArticleInput): Promise<DevtoArticlePreview> {
		const body = DevtoClient._toArticleBody(input);
		return await this._request('POST', '/articles/preview', body, DevtoArticlePreviewSchema);
	}

	/**
	 * Search the published articles by words, in the titles, the tags, and the text.
	 *
	 * @param words The words to search.
	 * @param page The page.
	 * @param top Only the articles of the last N days, or undefined.
	 * @returns The articles.
	 */
	async searchArticles(words: string, page: DevtoPage, top?: number): Promise<DevtoArticle[]> {
		const path = DevtoClient._withQuery('/articles/search', {
			q: words,
			top,
			page: page.page,
			per_page: page.perPage,
		});
		return await this._request('GET', path, undefined, DevtoArticleListSchema);
	}

	/**
	 * Search the published articles by meaning, not by exact words.
	 *
	 * @param words The words to search.
	 * @param page The page.
	 * @returns The articles.
	 */
	async semanticSearchArticles(words: string, page: DevtoPage): Promise<DevtoArticle[]> {
		const path = DevtoClient._withQuery('/articles/semantic_search', {
			q: words,
			page: page.page,
			per_page: page.perPage,
		});
		return await this._request('GET', path, undefined, DevtoArticleListSchema);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Images
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Upload an image. The image is public as soon as it is uploaded.
	 *
	 * @param fileName The name of the file, for example `cover.png`.
	 * @param data The content of the file.
	 * @param contentType The media type of the file, for example `image/png`.
	 * @returns The uploaded image, with its address.
	 */
	async uploadImage(fileName: string, data: Uint8Array, contentType: string): Promise<DevtoImage> {
		const formData = new FormData();
		formData.append('image', new Blob([new Uint8Array(data)], {
			type: contentType,
		}), fileName);
		return await this._request('POST', '/images', formData, DevtoImageSchema);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Comments
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * List the comments of an article, with their answers.
	 *
	 * @param articleId The identifier of the article.
	 * @returns The comments.
	 */
	async listComments(articleId: number): Promise<DevtoComment[]> {
		const path = DevtoClient._withQuery('/comments', {
			a_id: articleId,
		});
		return await this._request('GET', path, undefined, DevtoCommentListSchema);
	}

	/**
	 * Read one comment, with its answers.
	 *
	 * @param commentId The identifier of the comment, made of letters and digits.
	 * @returns The comment.
	 */
	async getComment(commentId: string): Promise<DevtoComment> {
		return await this._request('GET', `/comments/${encodeURIComponent(commentId)}`, undefined, DevtoCommentSchema);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Analytics
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Read the totals of the analytics, for the user or for one article.
	 *
	 * @param query The filters.
	 * @returns The totals.
	 */
	async getAnalyticsTotals(query: DevtoAnalyticsQuery): Promise<DevtoAnalyticsTotals> {
		const path = DevtoClient._withQuery('/analytics/totals', {
			article_id: query.articleId,
		});
		return await this._request('GET', path, undefined, DevtoAnalyticsTotalsSchema);
	}

	/**
	 * Read the analytics of each day from a start date.
	 *
	 * @param query The filters; `start` is required.
	 * @returns The totals of each day.
	 */
	async getAnalyticsHistorical(query: DevtoAnalyticsQuery): Promise<DevtoAnalyticsDaily> {
		if (query.start === undefined) {
			throw new Error('The historical analytics need a start date.');
		}
		const path = DevtoClient._withQuery('/analytics/historical', {
			start: query.start,
			end: query.end,
			article_id: query.articleId,
		});
		return await this._request('GET', path, undefined, DevtoAnalyticsDailySchema);
	}

	/**
	 * Read the analytics of the past day.
	 *
	 * @param query The filters.
	 * @returns The totals of each day.
	 */
	async getAnalyticsPastDay(query: DevtoAnalyticsQuery): Promise<DevtoAnalyticsDaily> {
		const path = DevtoClient._withQuery('/analytics/past_day', {
			article_id: query.articleId,
		});
		return await this._request('GET', path, undefined, DevtoAnalyticsDailySchema);
	}

	/**
	 * Read the domains that sent readers.
	 *
	 * @param query The filters.
	 * @returns The domains.
	 */
	async getAnalyticsReferrers(query: DevtoAnalyticsQuery): Promise<DevtoAnalyticsReferrers> {
		const path = DevtoClient._withQuery('/analytics/referrers', {
			start: query.start,
			end: query.end,
			article_id: query.articleId,
		});
		return await this._request('GET', path, undefined, DevtoAnalyticsReferrersSchema);
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
	 * @param body The body: `FormData` is sent as is, any other value is sent as JSON, undefined sends no body.
	 * @param schema The schema of the response.
	 * @returns The checked response.
	 */
	private async _request<T>(
		method: string,
		path: string,
		body: unknown,
		schema: z.ZodType<T, z.ZodTypeDef, unknown>,
	): Promise<T> {
		const headers: Record<string, string> = {
			'api-key': this._apiKey,
			'accept': 'application/vnd.forem.api-v1+json',
			'user-agent': 'devto_cli',
		};
		const init: RequestInit = {
			method,
			headers,
		};
		if (body instanceof FormData) {
			init.body = body;
		} else if (body !== undefined) {
			headers['content-type'] = 'application/json';
			init.body = JSON.stringify(body);
		}

		let response = await this._fetchFn(`${this._baseUrl}${path}`, init);
		for (let retry = 1; response.status === 429 && retry <= this._maxRetries; retry++) {
			await this._sleepFn(DevtoClient._retryDelayOf(response, retry));
			response = await this._fetchFn(`${this._baseUrl}${path}`, init);
		}
		const text = await response.text();
		if (response.ok === false) {
			throw new DevtoApiError(response.status, `dev.to API error ${response.status} on ${method} ${path}: ${text}`);
		}
		return schema.parse(JSON.parse(text));
	}

	/**
	 * Give the wait before a retry: the `retry-after` header in seconds when dev.to sends it, otherwise a wait that
	 * doubles at each retry.
	 *
	 * @param response The answer 429.
	 * @param retry The number of the retry, from 1.
	 * @returns The wait, in milliseconds.
	 */
	private static _retryDelayOf(response: Response, retry: number): number {
		const retryAfter = Number(response.headers.get('retry-after'));
		if (Number.isFinite(retryAfter) === true && retryAfter > 0) {
			return retryAfter * 1000;
		}
		return DEFAULT_RETRY_DELAY * 2 ** (retry - 1);
	}

	/**
	 * Add the query parameters to a path. An undefined value is not added.
	 *
	 * @param path The path.
	 * @param query The query parameters.
	 * @returns The path with the query parameters.
	 */
	private static _withQuery(path: string, query: QueryParams): string {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) {
				params.set(key, String(value));
			}
		}
		const queryStr = params.toString();
		return queryStr.length === 0 ? path : `${path}?${queryStr}`;
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
