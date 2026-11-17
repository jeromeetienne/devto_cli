import Assert from 'node:assert/strict';
import Test from 'node:test';
import { AnalyticsFormatter } from '../src/formatters/analytics_formatter.js';
import { CommentFormatter } from '../src/formatters/comment_formatter.js';
import { HtmlText } from '../src/formatters/html_text.js';
import { OutputFormat } from '../src/formatters/output_format.js';
import { ResultFormatter } from '../src/formatters/result_formatter.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	FormattersTest — checks the formats of the comments, the analytics, and the images
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const COMMENT = {
	id_code: 'abc1',
	body_html: '<p>Nice &amp; clear</p>',
	created_at: '2026-11-17T12:00:00Z',
	user: {
		username: 'someone',
	},
	children: [
		{
			id_code: 'abc2',
			body_html: '<p>Thanks</p>',
			created_at: '2026-11-17T13:00:00Z',
			user: null,
			children: [],
		},
	],
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

Test.test('HtmlText changes the paragraphs into lines, and decodes the entities', () => {
	const html = '<p>One &amp; two</p>\n<p>Three<br>four &#39;five&#39;</p>';
	Assert.equal(HtmlText.toPlainText(html), 'One & two\n\nThree\nfour \'five\'');
});

Test.test('OutputFormat writes a Markdown table', () => {
	Assert.equal(OutputFormat.markdownTable([
		'A',
		'B',
	], [
		['1', 'x|y'],
	]), '| A | B |\n|---|---|\n| 1 | x\\|y |');
});

Test.test('CommentFormatter indents the answers under their comment', () => {
	const markdown = CommentFormatter.format([COMMENT], 'markdown');
	Assert.equal(markdown, [
		'- **@someone**, 2026-11-17T12:00:00Z, `abc1`',
		'  Nice & clear',
		'  - **a deleted user**, 2026-11-17T13:00:00Z, `abc2`',
		'    Thanks',
	].join('\n'));
	const tty = CommentFormatter.format([COMMENT], 'tty');
	Assert.match(tty, /@someone/);
	Assert.match(tty, /\n {4}.*a deleted user/);
	Assert.deepEqual(JSON.parse(CommentFormatter.format([COMMENT], 'json')), [COMMENT]);
	Assert.equal(CommentFormatter.format([], 'markdown'), 'No comment.');
});

Test.test('AnalyticsFormatter writes the totals, the days, and the referrers', () => {
	const totals = AnalyticsFormatter.formatTotals(TOTALS, 'markdown');
	Assert.match(totals, /\| Page views \| 4 \|/);
	Assert.match(totals, /\| Reactions: like \| 3 \|/);
	Assert.match(AnalyticsFormatter.formatTotals(TOTALS, 'tty'), /Follows/);
	const daily = AnalyticsFormatter.formatDaily({
		'2026-11-01': TOTALS,
	}, 'markdown');
	Assert.match(daily, /\| 2026-11-01 \| 4 \| 3 \| 1 \| 2 \|/);
	const referrers = AnalyticsFormatter.formatReferrers({
		domains: [
			{
				domain: null,
				count: 2,
			},
		],
	}, 'markdown');
	Assert.match(referrers, /\| direct \| 2 \|/);
});

Test.test('ResultFormatter writes the image as a Markdown image', () => {
	const image = {
		url: 'https://cdn.example.com/a.png',
	};
	Assert.equal(ResultFormatter.formatImage(image, 'a.png', 'markdown'), '![a.png](https://cdn.example.com/a.png)');
	Assert.match(ResultFormatter.formatImage(image, 'a.png', 'tty'), /cdn\.example\.com/);
});
