import Assert from 'node:assert/strict';
import Test from 'node:test';
import { DevtoClient } from '../src/api/devto_client.js';
import { FakeFetch } from './fake_fetch.js';
import type { FakeAnswer } from './fake_fetch.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoClientApiTest — checks the requests of get, preview, images, comments, analytics, and search
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const ARTICLE = {
	id: 42,
	title: 'Hello',
	url: 'https://dev.to/someone/hello',
	published: false,
	published_at: null,
	extra_field: 'kept for the format json',
};

const TOTALS = {
	comments: {
		total: 1,
	},
	follows: {
		total: 2,
	},
	reactions: {
		total: 3,
		like: 3,
	},
	page_views: {
		total: 4,
		average_read_time_in_seconds: 5,
	},
};

const COMMENT = {
	id_code: 'abc1',
	body_html: '<p>Nice</p>',
	created_at: '2026-11-17T12:00:00Z',
	user: {
		username: 'someone',
		name: 'Some One',
	},
	children: [
		{
			id_code: 'abc2',
			body_html: '<p>Thanks</p>',
			created_at: '2026-11-17T13:00:00Z',
			user: null,
		},
	],
};

/**
 * Creates a client with a fake fetch function.
 */
class TestClient {
	/**
	 * Create a client and its fake fetch function.
	 *
	 * @param answers The answers of the fake fetch function.
	 * @returns The client and the fake fetch function.
	 */
	static create(answers: FakeAnswer[]): { client: DevtoClient, fakeFetch: FakeFetch } {
		const fakeFetch = new FakeFetch(answers);
		const client = new DevtoClient({
			apiKey: 'test-key',
			fetchFn: fakeFetch.fetchFn,
		});
		return {
			client,
			fakeFetch,
		};
	}
}

Test.test('getArticle reads a published article, and keeps the unknown fields', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 200,
			body: ARTICLE,
		},
	]);
	const article = await client.getArticle(42);
	Assert.equal(fakeFetch.sentRequests[0].url, 'https://dev.to/api/articles/42');
	Assert.equal(article.extra_field, 'kept for the format json');
});

Test.test('getArticle finds a draft in the articles of the user after a 404', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 404,
			body: {
				error: 'not found',
			},
		},
		{
			status: 200,
			body: [ARTICLE],
		},
	]);
	const article = await client.getArticle(42);
	Assert.equal(article.id, 42);
	Assert.equal(fakeFetch.sentRequests[1].url, 'https://dev.to/api/articles/me/all?page=1&per_page=1000');
});

Test.test('getArticle throws an error when no article has the identifier', async () => {
	const { client } = TestClient.create([
		{
			status: 404,
			body: {},
		},
		{
			status: 200,
			body: [],
		},
	]);
	await Assert.rejects(client.getArticle(7), /No article with the identifier 7/);
});

Test.test('previewArticle sends the text and reads the HTML', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 200,
			body: {
				body_html: '<p>Hi</p>',
				title: null,
			},
		},
	]);
	const preview = await client.previewArticle({
		bodyMarkdown: 'Hi',
	});
	Assert.equal(preview.body_html, '<p>Hi</p>');
	Assert.equal(fakeFetch.sentRequests[0].url, 'https://dev.to/api/articles/preview');
	Assert.deepEqual(fakeFetch.jsonBodyOf(0), {
		article: {
			body_markdown: 'Hi',
		},
	});
});

Test.test('uploadImage sends the file as multipart form data, without the JSON content type', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 201,
			body: {
				url: 'https://example.com/uploaded.png',
			},
		},
	]);
	const image = await client.uploadImage('cover.png', new Uint8Array([1, 2, 3]), 'image/png');
	Assert.equal(image.url, 'https://example.com/uploaded.png');
	const sentRequest = fakeFetch.sentRequests[0];
	Assert.equal(sentRequest.url, 'https://dev.to/api/images');
	Assert.equal((sentRequest.init.headers as Record<string, string>)['content-type'], undefined);
	const formData = sentRequest.init.body as FormData;
	const file = formData.get('image') as File;
	Assert.equal(file.name, 'cover.png');
	Assert.equal(file.type, 'image/png');
	Assert.equal(file.size, 3);
});

Test.test('listComments and getComment read the comments with their answers', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 200,
			body: [COMMENT],
		},
		{
			status: 200,
			body: COMMENT,
		},
	]);
	const comments = await client.listComments(42);
	Assert.equal(fakeFetch.sentRequests[0].url, 'https://dev.to/api/comments?a_id=42');
	Assert.equal(comments[0].children[0].id_code, 'abc2');
	Assert.deepEqual(comments[0].children[0].children, []);
	const comment = await client.getComment('abc1');
	Assert.equal(fakeFetch.sentRequests[1].url, 'https://dev.to/api/comments/abc1');
	Assert.equal(comment.user?.username, 'someone');
});

Test.test('the analytics send the filters that are given, and only them', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 200,
			body: TOTALS,
		},
		{
			status: 200,
			body: {
				'2026-11-01': TOTALS,
			},
		},
		{
			status: 200,
			body: {
				'2026-11-17': TOTALS,
			},
		},
		{
			status: 200,
			body: {
				domains: [
					{
						domain: 'example.com',
						count: 3,
					},
				],
			},
		},
	]);
	const totals = await client.getAnalyticsTotals({});
	Assert.equal(totals.page_views.total, 4);
	Assert.equal(fakeFetch.sentRequests[0].url, 'https://dev.to/api/analytics/totals');
	const historical = await client.getAnalyticsHistorical({
		start: '2026-11-01',
		articleId: 42,
	});
	Assert.equal(historical['2026-11-01'].follows.total, 2);
	Assert.equal(fakeFetch.sentRequests[1].url, 'https://dev.to/api/analytics/historical?start=2026-11-01&article_id=42');
	await client.getAnalyticsPastDay({});
	Assert.equal(fakeFetch.sentRequests[2].url, 'https://dev.to/api/analytics/past_day');
	const referrers = await client.getAnalyticsReferrers({
		start: '2026-11-01',
	});
	Assert.equal(referrers.domains[0].count, 3);
	Assert.equal(fakeFetch.sentRequests[3].url, 'https://dev.to/api/analytics/referrers?start=2026-11-01');
});

Test.test('an answer 429 is retried after the wait of the header retry-after', async () => {
	const fakeFetch = new FakeFetch([
		{
			status: 429,
			body: 'Retry later',
		},
		{
			status: 200,
			body: {
				id: 1,
				username: 'someone',
			},
		},
	]);
	const waits: number[] = [];
	const client = new DevtoClient({
		apiKey: 'test-key',
		fetchFn: fakeFetch.fetchFn,
		sleepFn: async (milliseconds: number) => {
			waits.push(milliseconds);
		},
	});
	const user = await client.getMe();
	Assert.equal(user.username, 'someone');
	Assert.equal(fakeFetch.sentRequests.length, 2);
	Assert.deepEqual(waits, [
		5000,
	]);
});

Test.test('an answer 429 becomes an error after the last retry', async () => {
	const fakeFetch = new FakeFetch([
		{
			status: 429,
			body: 'Retry later',
		},
	]);
	const client = new DevtoClient({
		apiKey: 'test-key',
		fetchFn: fakeFetch.fetchFn,
		sleepFn: async () => {},
		maxRetries: 2,
	});
	await Assert.rejects(client.getMe(), /429/);
	Assert.equal(fakeFetch.sentRequests.length, 3);
});

Test.test('getAnalyticsHistorical refuses a query without a start date', async () => {
	const { client } = TestClient.create([
		{
			status: 200,
			body: {},
		},
	]);
	await Assert.rejects(client.getAnalyticsHistorical({}), /start date/);
});

Test.test('the searches and the list of the published articles send their query parameters', async () => {
	const { client, fakeFetch } = TestClient.create([
		{
			status: 200,
			body: [ARTICLE],
		},
	]);
	await client.searchArticles('rust speed', {
		page: 1,
		perPage: 5,
	}, 7);
	Assert.equal(fakeFetch.sentRequests[0].url, 'https://dev.to/api/articles/search?q=rust+speed&top=7&page=1&per_page=5');
	await client.semanticSearchArticles('fast builds', {
		page: 2,
	});
	Assert.equal(fakeFetch.sentRequests[1].url, 'https://dev.to/api/articles/semantic_search?q=fast+builds&page=2');
	await client.listPublishedArticles({
		tag: 'rust',
		username: 'someone',
	});
	Assert.equal(fakeFetch.sentRequests[2].url, 'https://dev.to/api/articles?tag=rust&username=someone');
});
