import Assert from 'node:assert/strict';
import Test from 'node:test';
import { DevtoClient } from '../src/api/devto_client.js';
import type { FetchFn } from '../src/api/devto_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoClientTest — checks the requests that DevtoClient sends
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * One request that the fake fetch function received.
 */
type SentRequest = {
	/** The address of the request. */
	url: string;
	/** The options of the request. */
	init: RequestInit;
};

/**
 * Creates fake fetch functions that record each request.
 */
class FakeFetch {
	/** The requests that the fake fetch function received. */
	readonly sentRequests: SentRequest[] = [];

	/**
	 * Create a fake fetch function that always answers with the same response.
	 *
	 * @param status The HTTP status of the response.
	 * @param body The body of the response.
	 * @returns The fake fetch function.
	 */
	create(status: number, body: unknown): FetchFn {
		return async (url: string, init: RequestInit) => {
			this.sentRequests.push({
				url,
				init,
			});
			return new Response(JSON.stringify(body), {
				status,
			});
		};
	}
}

const ARTICLE = {
	id: 42,
	title: 'Hello',
	url: 'https://dev.to/someone/hello',
	published: false,
	published_at: null,
	cover_image: 'https://example.com/cover.png',
};

Test.test('createArticle sends a draft with the cover image and the API key', async () => {
	const fakeFetch = new FakeFetch();
	const client = new DevtoClient({
		apiKey: 'test-key',
		fetchFn: fakeFetch.create(201, ARTICLE),
	});
	const article = await client.createArticle({
		title: 'Hello',
		bodyMarkdown: '# Hello',
		coverImageUrl: 'https://example.com/cover.png',
	});
	Assert.equal(article.id, 42);
	const sentRequest = fakeFetch.sentRequests[0];
	Assert.equal(sentRequest.url, 'https://dev.to/api/articles');
	Assert.equal(sentRequest.init.method, 'POST');
	Assert.equal((sentRequest.init.headers as Record<string, string>)['api-key'], 'test-key');
	Assert.deepEqual(JSON.parse(String(sentRequest.init.body)), {
		article: {
			title: 'Hello',
			body_markdown: '# Hello',
			published: false,
			main_image: 'https://example.com/cover.png',
		},
	});
});

Test.test('createArticle with a publication date schedules a published article', async () => {
	const fakeFetch = new FakeFetch();
	const client = new DevtoClient({
		apiKey: 'test-key',
		fetchFn: fakeFetch.create(201, ARTICLE),
	});
	await client.createArticle({
		title: 'Later',
		publishedAt: '2030-01-01T09:00:00.000Z',
	});
	const body = JSON.parse(String(fakeFetch.sentRequests[0].init.body));
	Assert.equal(body.article.published, true);
	Assert.equal(body.article.published_at, '2030-01-01T09:00:00.000Z');
});

Test.test('updateArticle sends only the given values', async () => {
	const fakeFetch = new FakeFetch();
	const client = new DevtoClient({
		apiKey: 'test-key',
		fetchFn: fakeFetch.create(200, ARTICLE),
	});
	await client.updateArticle(42, {
		title: 'New title',
	});
	const sentRequest = fakeFetch.sentRequests[0];
	Assert.equal(sentRequest.url, 'https://dev.to/api/articles/42');
	Assert.equal(sentRequest.init.method, 'PUT');
	Assert.deepEqual(JSON.parse(String(sentRequest.init.body)), {
		article: {
			title: 'New title',
		},
	});
});

Test.test('listMyArticles reads the path of the filter', async () => {
	const fakeFetch = new FakeFetch();
	const client = new DevtoClient({
		apiKey: 'test-key',
		fetchFn: fakeFetch.create(200, [ARTICLE]),
	});
	const articles = await client.listMyArticles('unpublished', 2, 10);
	Assert.equal(articles.length, 1);
	Assert.equal(fakeFetch.sentRequests[0].url, 'https://dev.to/api/articles/me/unpublished?page=2&per_page=10');
});

Test.test('an error status throws an error with the status', async () => {
	const fakeFetch = new FakeFetch();
	const client = new DevtoClient({
		apiKey: 'bad-key',
		fetchFn: fakeFetch.create(401, {
			error: 'unauthorized',
		}),
	});
	await Assert.rejects(client.getMe(), /401/);
});
