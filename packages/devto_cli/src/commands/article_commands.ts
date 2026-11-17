import Fs from 'node:fs';
import Path from 'node:path';
import type { Command } from 'commander';
import type { DevtoClient } from '../api/devto_client.js';
import type { DevtoArticleFilter, DevtoArticleInput } from '../api/devto_types.js';
import { ArticleFormatter } from '../formatters/article_formatter.js';
import { OutputFormat } from '../formatters/output_format.js';
import { ImageUploader } from '../images/image_uploader.js';
import { ArticleOptions } from './article_options.js';
import type { ArticleCommandOptions } from './article_options.js';
import { CommandClient } from './command_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleCommands — the commands create, update, get, preview, and list of the articles
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The options of the commands `create`, `update`, and `preview`, before the body file is read.
 */
type RawArticleOptions = ArticleCommandOptions & {
	/** The path of a Markdown file that holds the text of the article. */
	bodyFile?: string;
	/** The output format: json, markdown, or tty. */
	format: string;
};

/**
 * The options of the command line, with the text of the body, and the folder from which the local images start.
 */
type ReadArticleOptions = {
	/** The options, with the text of the body. */
	options: ArticleCommandOptions;
	/** The folder from which the relative paths of the local images start. */
	baseDir: string;
};

/**
 * The commands `create`, `update`, `get`, `preview`, and `list`.
 */
export class ArticleCommands {
	/**
	 * Add the commands `create`, `update`, `get`, `preview`, and `list` to the program.
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
		ArticleCommands._addPublishOptions(createCommand);
		createCommand.action(async (options: RawArticleOptions) => {
			const format = OutputFormat.parse(options.format);
			const client = await CommandClient.create();
			const input = await ArticleCommands._toInputWithImages(client, options);
			const article = await client.createArticle(input);
			console.log(ArticleFormatter.format([article], format));
		});

		const updateCommand = program
			.command('update')
			.description('update an article of the user')
			.argument('<articleId>', 'the identifier of the article')
			.option('--title <title>', 'the new title of the article')
			.option('--draft', 'change a published article back into a draft');
		ArticleCommands._addArticleOptions(updateCommand);
		ArticleCommands._addPublishOptions(updateCommand);
		updateCommand.action(async (articleIdStr: string, options: RawArticleOptions) => {
			const articleId = CommandClient.parsePositiveInteger(articleIdStr, 'article identifier');
			const format = OutputFormat.parse(options.format);
			const client = await CommandClient.create();
			const input = await ArticleCommands._toInputWithImages(client, options);
			const article = await client.updateArticle(articleId, input);
			console.log(ArticleFormatter.format([article], format));
		});

		program
			.command('get')
			.description('show one article, a published article or a draft of the user, with its text')
			.argument('<articleId>', 'the identifier of the article')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (articleIdStr: string, options: { format: string }) => {
				const articleId = CommandClient.parsePositiveInteger(articleIdStr, 'article identifier');
				const format = OutputFormat.parse(options.format);
				const client = await CommandClient.create();
				const article = await client.getArticle(articleId);
				console.log(ArticleFormatter.formatDetail(article, format));
			});

		const previewCommand = program
			.command('preview')
			.description('show the HTML of an article without saving it; local images are not uploaded')
			.option('--title <title>', 'the title of the article');
		ArticleCommands._addArticleOptions(previewCommand);
		previewCommand.action(async (options: RawArticleOptions) => {
			const format = OutputFormat.parse(options.format);
			const client = await CommandClient.create();
			const readOptions = await ArticleCommands._readBody(options);
			const input = ArticleOptions.toArticleInput(readOptions.options, new Date());
			const preview = await client.previewArticle(input);
			console.log(ArticleFormatter.formatPreview(preview, format));
		});

		program
			.command('list')
			.description('list the articles of the user')
			.option('--filter <filter>', 'all, published, or unpublished', 'all')
			.option('--page <page>', 'the page number, from 1', '1')
			.option('--per-page <perPage>', 'the number of articles on each page', '30')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (options: { filter: string, page: string, perPage: string, format: string }) => {
				const filter = ArticleCommands._parseFilter(options.filter);
				const format = OutputFormat.parse(options.format);
				const page = CommandClient.parsePositiveInteger(options.page, 'page');
				const perPage = CommandClient.parsePositiveInteger(options.perPage, 'number of articles on each page');
				const client = await CommandClient.create();
				const articles = await client.listMyArticles(filter, page, perPage);
				console.log(ArticleFormatter.format(articles, format));
			});
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Add the options of the content of an article, which the commands `create`, `update`, and `preview` share.
	 *
	 * @param command The command.
	 * @returns Nothing.
	 */
	private static _addArticleOptions(command: Command): void {
		command
			.option('--body <body>', 'the text of the article, in Markdown')
			.option('--body-file <bodyFile>', 'the path of a Markdown file; its local images are uploaded')
			.option('--tags <tags>', 'at most 4 tags, separated by commas')
			.option('--cover-image <coverImage>', 'the address of the cover image, or a local file to upload')
			.option('--description <description>', 'the description of the article')
			.option('--canonical-url <canonicalUrl>', 'the canonical address of the article')
			.option('--series <series>', 'the name of the series')
			.option('--format <format>', OutputFormat.HELP, 'tty');
	}

	/**
	 * Add the options of the publication, which the commands `create` and `update` share.
	 *
	 * @param command The command.
	 * @returns Nothing.
	 */
	private static _addPublishOptions(command: Command): void {
		command
			.option('--publish', 'publish the article now')
			.option('--publish-at <publishAt>', 'publish the article at a future date, for example 2026-12-01T09:00:00Z');
	}

	/**
	 * Read the options, upload the local cover image and the local images of the text, and give the values of
	 * the article.
	 *
	 * @param client The client that uploads the images.
	 * @param options The options of the command line.
	 * @returns The values of the article, with the addresses of the uploaded images.
	 */
	private static async _toInputWithImages(client: DevtoClient, options: RawArticleOptions): Promise<DevtoArticleInput> {
		const readOptions = await ArticleCommands._readBody(options);
		const input = ArticleOptions.toArticleInput(readOptions.options, new Date());
		const imageUploader = new ImageUploader(client, (filePath: string, address: string) => {
			console.error(`Uploaded ${filePath} to ${address}`);
		});
		if (input.coverImageUrl !== undefined) {
			input.coverImageUrl = await imageUploader.resolveCoverImage(input.coverImageUrl, process.cwd());
		}
		if (input.bodyMarkdown !== undefined) {
			input.bodyMarkdown = await imageUploader.uploadMarkdownImages(input.bodyMarkdown, readOptions.baseDir);
		}
		return input;
	}

	/**
	 * Read the body file, when the options give one.
	 *
	 * @param options The options of the command line.
	 * @returns The options with the text of the body, and the folder from which the local images start.
	 */
	private static async _readBody(options: RawArticleOptions): Promise<ReadArticleOptions> {
		if (options.bodyFile === undefined) {
			return {
				options,
				baseDir: process.cwd(),
			};
		}
		if (options.body !== undefined) {
			throw new Error('Use only one of --body and --body-file.');
		}
		const body = await Fs.promises.readFile(options.bodyFile, 'utf8');
		return {
			options: {
				...options,
				body,
			},
			baseDir: Path.dirname(Path.resolve(options.bodyFile)),
		};
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
}
