import Chalk from 'chalk';
import type { DevtoComment } from '../api/devto_engagement_types.js';
import { HtmlText } from './html_text.js';
import { OutputFormat } from './output_format.js';
import type { OutputFormatName } from './output_format.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommentFormatter — writes the comments and their answers as JSON, as Markdown, or for the terminal
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Writes the comments and their answers in one output format.
 */
export class CommentFormatter {
	/**
	 * Write the comments in the output format. The answers are indented under their comment.
	 *
	 * @param comments The comments.
	 * @param format The output format.
	 * @returns The text to write on the standard output.
	 */
	static format(comments: DevtoComment[], format: OutputFormatName): string {
		if (format === 'json') {
			return OutputFormat.toJson(comments);
		}
		if (comments.length === 0) {
			return format === 'tty' ? Chalk.dim('No comment.') : 'No comment.';
		}
		const lines: string[] = [];
		for (const comment of comments) {
			CommentFormatter._addLines(comment, 0, format, lines);
		}
		return lines.join('\n');
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Add the lines of one comment and of its answers.
	 *
	 * @param comment The comment.
	 * @param depth The depth of the comment: 0 for a comment, 1 for an answer, and so on.
	 * @param format The output format, `markdown` or `tty`.
	 * @param lines The lines, which this function changes.
	 * @returns Nothing.
	 */
	private static _addLines(comment: DevtoComment, depth: number, format: OutputFormatName, lines: string[]): void {
		const author = comment.user !== null ? `@${comment.user.username}` : 'a deleted user';
		const text = HtmlText.toPlainText(comment.body_html);
		if (format === 'markdown') {
			const indent = '  '.repeat(depth);
			lines.push(`${indent}- **${author}**, ${comment.created_at}, \`${comment.id_code}\``);
			for (const textLine of text.split('\n')) {
				lines.push(`${indent}  ${textLine}`.trimEnd());
			}
		} else {
			const indent = '    '.repeat(depth);
			lines.push(`${indent}${Chalk.bold(author)}  ${Chalk.dim(comment.created_at)}  ${Chalk.cyan(comment.id_code)}`);
			for (const textLine of text.split('\n')) {
				lines.push(`${indent}  ${textLine}`.trimEnd());
			}
		}
		for (const child of comment.children) {
			CommentFormatter._addLines(child, depth + 1, format, lines);
		}
	}
}
