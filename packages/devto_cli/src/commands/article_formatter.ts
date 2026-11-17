import Chalk from 'chalk';
import type { DevtoArticle } from '../api/devto_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleFormatter — writes the articles as JSON, as Markdown, or for the terminal with colors
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The output formats of the commands `create`, `update`, and `list`.
 */
export type OutputFormat = 'json' | 'markdown' | 'tty';

/**
 * The output formats, in the order that the help of the command line shows them.
 */
export const OUTPUT_FORMATS: readonly OutputFormat[] = [
	'json',
	'markdown',
	'tty',
];

/**
 * Writes the articles in one output format.
 */
export class ArticleFormatter {
	/**
	 * Check the value of the option `--format`.
	 *
	 * @param formatStr The value of the option.
	 * @returns The output format.
	 */
	static parseFormat(formatStr: string): OutputFormat {
		const format = OUTPUT_FORMATS.find((outputFormat) => outputFormat === formatStr);
		if (format === undefined) {
			throw new Error(`The format "${formatStr}" is not one of ${OUTPUT_FORMATS.join(', ')}.`);
		}
		return format;
	}

	/**
	 * Write the articles in the output format.
	 *
	 * @param articles The articles.
	 * @param format The output format.
	 * @returns The text to write on the standard output.
	 */
	static format(articles: DevtoArticle[], format: OutputFormat): string {
		if (format === 'json') {
			return JSON.stringify(articles, null, '\t');
		}
		if (format === 'markdown') {
			return ArticleFormatter._formatMarkdown(articles);
		}
		return ArticleFormatter._formatTty(articles);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Write the articles as a Markdown table.
	 *
	 * @param articles The articles.
	 * @returns The Markdown table.
	 */
	private static _formatMarkdown(articles: DevtoArticle[]): string {
		const lines = [
			'| Identifier | Status | Title | Address | Cover image |',
			'|---|---|---|---|---|',
		];
		for (const article of articles) {
			const cells = [
				String(article.id),
				ArticleFormatter._status(article),
				ArticleFormatter._escapeCell(article.title),
				ArticleFormatter._escapeCell(article.url ?? ''),
				ArticleFormatter._escapeCell(article.cover_image ?? ''),
			];
			lines.push(`| ${cells.join(' | ')} |`);
		}
		return lines.join('\n');
	}

	/**
	 * Write the articles for the terminal, with colors.
	 *
	 * @param articles The articles.
	 * @returns The text, with the color codes of the terminal.
	 */
	private static _formatTty(articles: DevtoArticle[]): string {
		const blocks: string[] = [];
		for (const article of articles) {
			const status = ArticleFormatter._status(article);
			const statusColored = status === 'published' ? Chalk.green(status) : Chalk.yellow(status);
			const lines = [
				`${Chalk.cyan(String(article.id))}  ${statusColored}  ${Chalk.bold(article.title)}`,
				`  ${Chalk.blue.underline(article.url ?? '')}`,
			];
			if (article.cover_image !== undefined && article.cover_image !== null) {
				lines.push(`  ${Chalk.dim(`cover image: ${article.cover_image}`)}`);
			}
			blocks.push(lines.join('\n'));
		}
		if (blocks.length === 0) {
			return Chalk.dim('No article.');
		}
		return blocks.join('\n');
	}

	/**
	 * The status of an article.
	 *
	 * @param article The article.
	 * @returns `published` or `draft`.
	 */
	private static _status(article: DevtoArticle): string {
		return article.published === true ? 'published' : 'draft';
	}

	/**
	 * Escape the characters that break a cell of a Markdown table.
	 *
	 * @param text The text of the cell.
	 * @returns The escaped text.
	 */
	private static _escapeCell(text: string): string {
		return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
	}
}
