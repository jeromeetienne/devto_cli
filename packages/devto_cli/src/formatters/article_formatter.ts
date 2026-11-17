import Chalk from 'chalk';
import type { DevtoArticle, DevtoArticlePreview } from '../api/devto_types.js';
import { HtmlText } from './html_text.js';
import { OutputFormat } from './output_format.js';
import type { OutputFormatName } from './output_format.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleFormatter — writes the articles and the previews as JSON, as Markdown, or for the terminal
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The status of an article.
 */
export type ArticleStatus = 'draft' | 'scheduled' | 'published';

/**
 * Writes the articles and the previews in one output format.
 */
export class ArticleFormatter {
	/**
	 * Write a list of articles in the output format.
	 *
	 * @param articles The articles.
	 * @param format The output format.
	 * @param now The current date, to tell a scheduled article from a published article.
	 * @returns The text to write on the standard output.
	 */
	static format(articles: DevtoArticle[], format: OutputFormatName, now: Date = new Date()): string {
		if (format === 'json') {
			return OutputFormat.toJson(articles);
		}
		if (format === 'markdown') {
			const rows = articles.map((article) => [
				String(article.id),
				ArticleFormatter.statusOf(article, now),
				article.title,
				article.url ?? '',
				ArticleFormatter._coverImageOf(article) ?? '',
			]);
			return OutputFormat.markdownTable([
				'Identifier',
				'Status',
				'Title',
				'Address',
				'Cover image',
			], rows);
		}
		if (articles.length === 0) {
			return Chalk.dim('No article.');
		}
		return articles.map((article) => ArticleFormatter._formatTtyBlock(article, now)).join('\n');
	}

	/**
	 * Write one article with its details and its text in the output format.
	 *
	 * @param article The article.
	 * @param format The output format.
	 * @param now The current date, to tell a scheduled article from a published article.
	 * @returns The text to write on the standard output.
	 */
	static formatDetail(article: DevtoArticle, format: OutputFormatName, now: Date = new Date()): string {
		if (format === 'json') {
			return OutputFormat.toJson(article);
		}
		const tags = ArticleFormatter._tagsOf(article);
		const body = article.body_markdown ?? '';
		if (format === 'markdown') {
			const rows = [
				['Identifier', String(article.id)],
				['Status', ArticleFormatter.statusOf(article, now)],
				['Address', article.url ?? ''],
				['Publication date', article.published_at ?? ''],
				['Tags', tags.join(', ')],
				['Cover image', ArticleFormatter._coverImageOf(article) ?? ''],
			];
			const table = OutputFormat.markdownTable([
				'Field',
				'Value',
			], rows);
			return `# ${article.title}\n\n${table}\n\n${body}`.trimEnd();
		}
		const lines = [
			ArticleFormatter._formatTtyBlock(article, now),
		];
		if (article.published_at !== undefined && article.published_at !== null) {
			lines.push(`  ${Chalk.dim(`publication date: ${article.published_at}`)}`);
		}
		if (tags.length > 0) {
			lines.push(`  ${Chalk.magenta(tags.map((tag) => `#${tag}`).join(' '))}`);
		}
		if (article.description !== undefined && article.description !== null) {
			lines.push(`  ${Chalk.italic(article.description)}`);
		}
		if (body.length > 0) {
			lines.push('', body);
		}
		return lines.join('\n');
	}

	/**
	 * Write the preview of an article in the output format.
	 *
	 * @param preview The preview.
	 * @param format The output format: `json` gives all the fields, `markdown` gives the HTML, `tty` gives the text.
	 * @returns The text to write on the standard output.
	 */
	static formatPreview(preview: DevtoArticlePreview, format: OutputFormatName): string {
		if (format === 'json') {
			return OutputFormat.toJson(preview);
		}
		if (format === 'markdown') {
			return preview.body_html.trim();
		}
		const header = [
			Chalk.bold(preview.title ?? 'No title'),
		];
		if (preview.reading_time_minutes !== undefined) {
			header.push(Chalk.dim(`${preview.reading_time_minutes} min read`));
		}
		return `${header.join('  ')}\n\n${HtmlText.toPlainText(preview.body_html)}`;
	}

	/**
	 * Give the status of an article.
	 *
	 * @param article The article.
	 * @param now The current date.
	 * @returns `draft`, `scheduled`, or `published`.
	 */
	static statusOf(article: DevtoArticle, now: Date): ArticleStatus {
		if (article.published === false) {
			return 'draft';
		}
		if (article.published_at === undefined || article.published_at === null) {
			return article.published === true ? 'published' : 'draft';
		}
		return new Date(article.published_at).getTime() > now.getTime() ? 'scheduled' : 'published';
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Write the lines of one article for the terminal, with colors.
	 *
	 * @param article The article.
	 * @param now The current date.
	 * @returns The lines, with the color codes of the terminal.
	 */
	private static _formatTtyBlock(article: DevtoArticle, now: Date): string {
		const status = ArticleFormatter.statusOf(article, now);
		const statusColors = {
			draft: Chalk.yellow,
			scheduled: Chalk.blue,
			published: Chalk.green,
		};
		const author = article.user !== undefined ? `  ${Chalk.dim(`@${article.user.username}`)}` : '';
		const lines = [
			`${Chalk.cyan(String(article.id))}  ${statusColors[status](status)}  ${Chalk.bold(article.title)}${author}`,
		];
		if (article.url !== undefined && article.url !== null) {
			lines.push(`  ${Chalk.blue.underline(article.url)}`);
		}
		const coverImage = ArticleFormatter._coverImageOf(article);
		if (coverImage !== null) {
			lines.push(`  ${Chalk.dim(`cover image: ${coverImage}`)}`);
		}
		return lines.join('\n');
	}

	/**
	 * Give the address of the cover image of an article.
	 *
	 * @param article The article.
	 * @returns The address, or null when the article has no cover image.
	 */
	private static _coverImageOf(article: DevtoArticle): string | null {
		return article.cover_image ?? article.main_image ?? null;
	}

	/**
	 * Give the tags of an article as a list.
	 *
	 * @param article The article.
	 * @returns The tags.
	 */
	private static _tagsOf(article: DevtoArticle): string[] {
		if (article.tag_list === undefined) {
			return [];
		}
		if (Array.isArray(article.tag_list) === true) {
			return article.tag_list as string[];
		}
		return (article.tag_list as string).split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
	}
}
