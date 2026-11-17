import Assert from 'node:assert/strict';
import Test from 'node:test';
import { ArticleFormatter } from '../src/commands/article_formatter.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleFormatterTest — checks the output formats json, markdown, and tty
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const ARTICLE = {
	id: 42,
	title: 'Pipes | in a title',
	url: 'https://dev.to/someone/hello',
	published: false,
	published_at: null,
	cover_image: 'https://example.com/cover.png',
};

Test.test('json writes the articles as a JSON array', () => {
	const text = ArticleFormatter.format([ARTICLE], 'json');
	Assert.deepEqual(JSON.parse(text), [ARTICLE]);
});

Test.test('markdown writes a table, and escapes the pipes', () => {
	const text = ArticleFormatter.format([ARTICLE], 'markdown');
	const lines = text.split('\n');
	Assert.equal(lines[0], '| Identifier | Status | Title | Address | Cover image |');
	Assert.equal(lines[2], '| 42 | draft | Pipes \\| in a title | https://dev.to/someone/hello | https://example.com/cover.png |');
});

Test.test('tty writes the identifier, the status, the title, and the address', () => {
	const text = ArticleFormatter.format([ARTICLE], 'tty');
	Assert.match(text, /42/);
	Assert.match(text, /draft/);
	Assert.match(text, /Pipes \| in a title/);
	Assert.match(text, /https:\/\/dev\.to\/someone\/hello/);
});

Test.test('an unknown format is refused', () => {
	Assert.throws(() => {
		ArticleFormatter.parseFormat('xml');
	}, /not one of json, markdown, tty/);
});
