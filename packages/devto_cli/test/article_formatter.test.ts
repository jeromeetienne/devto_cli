import Assert from 'node:assert/strict';
import Test from 'node:test';
import { ArticleFormatter } from '../src/formatters/article_formatter.js';
import { OutputFormat } from '../src/formatters/output_format.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleFormatterTest — checks the output formats json, markdown, and tty of the articles
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const NOW = new Date('2026-11-17T12:00:00Z');

const ARTICLE = {
	id: 42,
	title: 'Pipes | in a title',
	url: 'https://dev.to/someone/hello',
	published: false,
	published_at: null,
	cover_image: 'https://example.com/cover.png',
};

Test.test('json writes the articles as a JSON array', () => {
	const text = ArticleFormatter.format([ARTICLE], 'json', NOW);
	Assert.deepEqual(JSON.parse(text), [ARTICLE]);
});

Test.test('markdown writes a table, and escapes the pipes', () => {
	const lines = ArticleFormatter.format([ARTICLE], 'markdown', NOW).split('\n');
	Assert.equal(lines[0], '| Identifier | Status | Title | Address | Cover image |');
	const expectedRow = [
		'| 42 | draft | Pipes \\| in a title |',
		'https://dev.to/someone/hello | https://example.com/cover.png |',
	].join(' ');
	Assert.equal(lines[2], expectedRow);
});

Test.test('tty writes the identifier, the status, the title, and the address', () => {
	const text = ArticleFormatter.format([ARTICLE], 'tty', NOW);
	Assert.match(text, /42/);
	Assert.match(text, /draft/);
	Assert.match(text, /Pipes \| in a title/);
	Assert.match(text, /https:\/\/dev\.to\/someone\/hello/);
});

Test.test('the status is draft, scheduled, or published', () => {
	Assert.equal(ArticleFormatter.statusOf(ARTICLE, NOW), 'draft');
	Assert.equal(ArticleFormatter.statusOf({
		...ARTICLE,
		published: true,
		published_at: '2030-01-01T00:00:00Z',
	}, NOW), 'scheduled');
	Assert.equal(ArticleFormatter.statusOf({
		id: 1,
		title: 'From a search, with no field published',
		published_at: '2026-01-01T00:00:00Z',
	}, NOW), 'published');
});

Test.test('formatDetail writes the tags and the text of the article', () => {
	const article = {
		...ARTICLE,
		tag_list: 'typescript, cli',
		body_markdown: '# Hello\n\nThe text.',
	};
	const markdown = ArticleFormatter.formatDetail(article, 'markdown', NOW);
	Assert.match(markdown, /^# Pipes \| in a title/);
	Assert.match(markdown, /\| Tags \| typescript, cli \|/);
	Assert.match(markdown, /The text\.$/);
	const tty = ArticleFormatter.formatDetail(article, 'tty', NOW);
	Assert.match(tty, /#typescript #cli/);
	Assert.match(tty, /The text\./);
});

Test.test('formatPreview writes the HTML in markdown, and the plain text in tty', () => {
	const preview = {
		body_html: '<h1>Hi</h1>\n<p>Hello &amp; welcome</p>',
		title: 'Hi',
		reading_time_minutes: 1,
	};
	Assert.equal(ArticleFormatter.formatPreview(preview, 'markdown'), '<h1>Hi</h1>\n<p>Hello &amp; welcome</p>');
	const tty = ArticleFormatter.formatPreview(preview, 'tty');
	Assert.match(tty, /1 min read/);
	Assert.match(tty, /Hello & welcome/);
	Assert.deepEqual(JSON.parse(ArticleFormatter.formatPreview(preview, 'json')), preview);
});

Test.test('an unknown format is refused', () => {
	Assert.throws(() => {
		OutputFormat.parse('xml');
	}, /not one of json, markdown, tty/);
});
