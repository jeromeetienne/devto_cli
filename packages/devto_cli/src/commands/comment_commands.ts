import type { Command } from 'commander';
import { CommentFormatter } from '../formatters/comment_formatter.js';
import { OutputFormat } from '../formatters/output_format.js';
import { CommandClient } from './command_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommentCommands — the commands comment list and comment get
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The commands `comment list` and `comment get`. The dev.to API cannot post a comment.
 */
export class CommentCommands {
	/**
	 * Add the commands `comment list` and `comment get` to the program.
	 *
	 * @param program The Commander.js program.
	 * @returns Nothing.
	 */
	static register(program: Command): void {
		const commentCommand = program
			.command('comment')
			.description('read the comments; the dev.to API cannot post a comment');

		commentCommand
			.command('list')
			.description('list the comments of an article, with their answers')
			.argument('<articleId>', 'the identifier of the article')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (articleIdStr: string, options: { format: string }) => {
				const articleId = CommandClient.parsePositiveInteger(articleIdStr, 'article identifier');
				const format = OutputFormat.parse(options.format);
				const client = await CommandClient.create();
				const comments = await client.listComments(articleId);
				console.log(CommentFormatter.format(comments, format));
			});

		commentCommand
			.command('get')
			.description('show one comment, with its answers')
			.argument('<commentId>', 'the identifier of the comment, made of letters and digits, for example 2k3n1')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (commentId: string, options: { format: string }) => {
				const format = OutputFormat.parse(options.format);
				const client = await CommandClient.create();
				const comment = await client.getComment(commentId);
				console.log(CommentFormatter.format([comment], format));
			});
	}
}
