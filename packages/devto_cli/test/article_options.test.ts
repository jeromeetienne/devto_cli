import Assert from 'node:assert/strict';
import Test from 'node:test';
import { ArticleOptions } from '../src/commands/article_options.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleOptionsTest — checks the options of the commands create and update
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const NOW = new Date('2026-11-17T12:00:00Z');

Test.test('without a publish option, the input has no published value', () => {
	const input = ArticleOptions.toArticleInput({
		title: 'Hello',
		tags: 'typescript, cli',
		coverImage: 'https://example.com/cover.png',
	}, NOW);
	Assert.equal(input.published, undefined);
	Assert.deepEqual(input.tags, [
		'typescript',
		'cli',
	]);
	Assert.equal(input.coverImageUrl, 'https://example.com/cover.png');
});

Test.test('a future publication date becomes an ISO 8601 string', () => {
	const input = ArticleOptions.toArticleInput({
		publishAt: '2026-12-01T09:00:00Z',
	}, NOW);
	Assert.equal(input.publishedAt, '2026-12-01T09:00:00.000Z');
});

Test.test('a past publication date is refused', () => {
	Assert.throws(() => {
		ArticleOptions.toArticleInput({
			publishAt: '2026-01-01T09:00:00Z',
		}, NOW);
	}, /not in the future/);
});

Test.test('an invalid publication date is refused', () => {
	Assert.throws(() => {
		ArticleOptions.toArticleInput({
			publishAt: 'tomorrow',
		}, NOW);
	}, /not a valid date/);
});

Test.test('more than one publish option is refused', () => {
	Assert.throws(() => {
		ArticleOptions.toArticleInput({
			publish: true,
			draft: true,
		}, NOW);
	}, /only one/);
});

Test.test('more than 4 tags are refused', () => {
	Assert.throws(() => {
		ArticleOptions.toArticleInput({
			tags: 'a,b,c,d,e',
		}, NOW);
	}, /at most 4 tags/);
});
