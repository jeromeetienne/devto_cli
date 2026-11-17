import type { Command } from 'commander';
import type { DevtoPage } from '../api/devto_types.js';
import { ArticleFormatter } from '../formatters/article_formatter.js';
import { OutputFormat } from '../formatters/output_format.js';
import { CommandClient } from './command_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SearchCommands — the commands search articles and search published
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The options of the page, as Commander.js gives them.
 */
type PageOptions = {
	/** The page number, from 1. */
	page: string;
	/** The number of articles on each page. */
	perPage: string;
	/** The output format. */
	format: string;
};

/**
 * The commands `search articles` and `search published`.
 */
export class SearchCommands {
	/**
	 * Add the search commands to the program.
	 *
	 * @param program The Commander.js program.
	 * @returns Nothing.
	 */
	static register(program: Command): void {
		const searchCommand = program
			.command('search')
			.description('search the published articles of all the users');

		searchCommand
			.command('articles')
			.description('search the published articles by words, or by meaning with --semantic')
			.argument('<words...>', 'the words to search')
			.option('--semantic', 'search by meaning, not by exact words')
			.option('--top <days>', 'only the articles of the last N days; not with --semantic')
			.option('--page <page>', 'the page number, from 1', '1')
			.option('--per-page <perPage>', 'the number of articles on each page', '10')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (words: string[], options: PageOptions & { semantic?: boolean, top?: string }) => {
				const format = OutputFormat.parse(options.format);
				const page = SearchCommands.toPage(options);
				if (options.semantic === true && options.top !== undefined) {
					throw new Error('Use only one of --semantic and --top.');
				}
				const top = options.top !== undefined ? CommandClient.parsePositiveInteger(options.top, 'top') : undefined;
				const client = await CommandClient.create();
				const query = words.join(' ');
				const articles = options.semantic === true
					? await client.semanticSearchArticles(query, page)
					: await client.searchArticles(query, page, top);
				console.log(ArticleFormatter.format(articles, format));
			});

		searchCommand
			.command('published')
			.description('list the published articles, with a tag, of a user, or the most popular')
			.option('--tag <tag>', 'only the articles with this tag')
			.option('--username <username>', 'only the articles of this user or of this organization')
			.option('--top <days>', 'only the most popular articles of the last N days')
			.option('--page <page>', 'the page number, from 1', '1')
			.option('--per-page <perPage>', 'the number of articles on each page', '10')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (options: PageOptions & { tag?: string, username?: string, top?: string }) => {
				const format = OutputFormat.parse(options.format);
				const page = SearchCommands.toPage(options);
				const top = options.top !== undefined ? CommandClient.parsePositiveInteger(options.top, 'top') : undefined;
				const client = await CommandClient.create();
				const articles = await client.listPublishedArticles({
					...page,
					tag: options.tag,
					username: options.username,
					top,
				});
				console.log(ArticleFormatter.format(articles, format));
			});
	}

	/**
	 * Check the options of the page.
	 *
	 * @param options The options of the command line.
	 * @returns The page.
	 */
	static toPage(options: PageOptions): DevtoPage {
		return {
			page: CommandClient.parsePositiveInteger(options.page, 'page'),
			perPage: CommandClient.parsePositiveInteger(options.perPage, 'number of articles on each page'),
		};
	}
}
