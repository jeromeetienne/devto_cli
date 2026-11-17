import Fs from 'node:fs';
import type { Command } from 'commander';
import { DevtoClient } from '../api/devto_client.js';
import type { DevtoArticle, DevtoArticleFilter } from '../api/devto_types.js';
import { CredentialStore } from '../config/credential_store.js';
import { ArticleOptions } from './article_options.js';
import type { ArticleCommandOptions } from './article_options.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleCommands — the commands that create, update, and list the articles
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The options of the commands `create` and `update`, before the body file is read.
 */
type RawArticleOptions = ArticleCommandOptions & {
	/** The path of a Markdown file that holds the text of the article. */
	bodyFile?: string;
	/** True to write the result as JSON. */
	json?: boolean;
};

/**
 * The commands `create`, `update`, and `list`.
 */
export class ArticleCommands {
	/**
	 * Add the commands `create`, `update`, and `list` to the program.
	 *
	 * @param program The Commander.js program.
	 * @returns Nothing.
	 */
	static register(program: Command): void {
		const createCommand = program
			.command('create')
			.description('create an article; without --publish or --publish-at, the article is a draft')
			.requiredOption('--title <title>', 'the title of the article');
		ArticleCommands._addArticleOptions(createCommand);
		createCommand.action(async (options: RawArticleOptions) => {
			const client = await ArticleCommands._getClient();
			const input = ArticleOptions.toArticleInput(await ArticleCommands._readBody(options), new Date());
			const article = await client.createArticle(input);
			ArticleCommands._printArticle(article, options.json === true);
		});

		const updateCommand = program
			.command('update')
			.description('update an article of the user')
			.argument('<articleId>', 'the identifier of the article')
			.option('--title <title>', 'the new title of the article')
			.option('--draft', 'change a published article back into a draft');
		ArticleCommands._addArticleOptions(updateCommand);
		updateCommand.action(async (articleIdStr: string, options: RawArticleOptions) => {
			const articleId = Number.parseInt(articleIdStr, 10);
			if (Number.isNaN(articleId)) {
				throw new Error(`The article identifier "${articleIdStr}" is not a number.`);
			}
			const client = await ArticleCommands._getClient();
			const input = ArticleOptions.toArticleInput(await ArticleCommands._readBody(options), new Date());
			const article = await client.updateArticle(articleId, input);
			ArticleCommands._printArticle(article, options.json === true);
		});

		program
			.command('list')
			.description('list the articles of the user')
			.option('--filter <filter>', 'all, published, or unpublished', 'all')
			.option('--page <page>', 'the page number, from 1', '1')
			.option('--per-page <perPage>', 'the number of articles on each page', '30')
			.option('--json', 'write the result as JSON')
			.action(async (options: { filter: string, page: string, perPage: string, json?: boolean }) => {
				const filter = ArticleCommands._parseFilter(options.filter);
				const client = await ArticleCommands._getClient();
				const page = Number.parseInt(options.page, 10);
				const perPage = Number.parseInt(options.perPage, 10);
				const articles = await client.listMyArticles(filter, page, perPage);
				if (options.json === true) {
					console.log(JSON.stringify(articles, null, '\t'));
					return;
				}
				for (const article of articles) {
					console.log(ArticleCommands._formatArticle(article));
				}
			});
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Add the options that the commands `create` and `update` share.
	 *
	 * @param command The command.
	 * @returns Nothing.
	 */
	private static _addArticleOptions(command: Command): void {
		command
			.option('--body <body>', 'the text of the article, in Markdown')
			.option('--body-file <bodyFile>', 'the path of a Markdown file that holds the text of the article')
			.option('--tags <tags>', 'at most 4 tags, separated by commas')
			.option('--cover-image <coverImage>', 'the address of the cover image')
			.option('--description <description>', 'the description of the article')
			.option('--canonical-url <canonicalUrl>', 'the canonical address of the article')
			.option('--series <series>', 'the name of the series')
			.option('--publish', 'publish the article now')
			.option('--publish-at <publishAt>', 'publish the article at a future date, for example 2026-12-01T09:00:00Z')
			.option('--json', 'write the result as JSON');
	}

	/**
	 * Read the body file, when the options give one.
	 *
	 * @param options The options of the command line.
	 * @returns The options, with the text of the body.
	 */
	private static async _readBody(options: RawArticleOptions): Promise<ArticleCommandOptions> {
		if (options.bodyFile === undefined) {
			return options;
		}
		if (options.body !== undefined) {
			throw new Error('Use only one of --body and --body-file.');
		}
		const body = await Fs.promises.readFile(options.bodyFile, 'utf8');
		return {
			...options,
			body,
		};
	}

	/**
	 * Create a client with the stored API key.
	 *
	 * @returns The client.
	 */
	private static async _getClient(): Promise<DevtoClient> {
		const credential = await new CredentialStore().load();
		if (credential === null) {
			throw new Error('No stored API key. Run `devto_cli login` first.');
		}
		return new DevtoClient({
			apiKey: credential.apiKey,
		});
	}

	/**
	 * Check the value of the option `--filter`.
	 *
	 * @param filterStr The value of the option.
	 * @returns The filter.
	 */
	private static _parseFilter(filterStr: string): DevtoArticleFilter {
		if (filterStr === 'all' || filterStr === 'published' || filterStr === 'unpublished') {
			return filterStr;
		}
		throw new Error(`The filter "${filterStr}" is not one of all, published, and unpublished.`);
	}

	/**
	 * Write one article on the standard output.
	 *
	 * @param article The article.
	 * @param isJson True to write the article as JSON.
	 * @returns Nothing.
	 */
	private static _printArticle(article: DevtoArticle, isJson: boolean): void {
		if (isJson === true) {
			console.log(JSON.stringify(article, null, '\t'));
			return;
		}
		console.log(ArticleCommands._formatArticle(article));
	}

	/**
	 * Format one article on one line.
	 *
	 * @param article The article.
	 * @returns The line.
	 */
	private static _formatArticle(article: DevtoArticle): string {
		const status = article.published === true ? 'published' : 'draft';
		const coverImage = article.cover_image ?? 'no cover image';
		return `${article.id}\t${status}\t${article.title}\t${article.url ?? ''}\t${coverImage}`;
	}
}
