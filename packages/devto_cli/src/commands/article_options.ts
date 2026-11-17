import type { DevtoArticleInput } from '../api/devto_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ArticleOptions — changes the options of the command line into the values of an article
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The options of the commands `create` and `update`, as Commander.js gives them.
 */
export type ArticleCommandOptions = {
	/** The title of the article. */
	title?: string;
	/** The text of the article, in Markdown. */
	body?: string;
	/** The tags, separated by commas. */
	tags?: string;
	/** The address of the cover image. */
	coverImage?: string;
	/** The description of the article. */
	description?: string;
	/** The canonical address of the article. */
	canonicalUrl?: string;
	/** The name of the series. */
	series?: string;
	/** True to publish the article now. */
	publish?: boolean;
	/** The future publication date. */
	publishAt?: string;
	/** True to change a published article back into a draft. */
	draft?: boolean;
};

/**
 * Changes the options of the command line into the values of an article.
 */
export class ArticleOptions {
	/**
	 * Check the options and change them into the values of an article.
	 *
	 * @param options The options of the command line, with the text of the body already read.
	 * @param now The current date, to check that a publication date is in the future.
	 * @returns The values of the article.
	 */
	static toArticleInput(options: ArticleCommandOptions, now: Date): DevtoArticleInput {
		const publishModes = [
			options.publish === true,
			options.publishAt !== undefined,
			options.draft === true,
		].filter((isSet) => isSet === true);
		if (publishModes.length > 1) {
			throw new Error('Use only one of --publish, --publish-at, and --draft.');
		}

		const input: DevtoArticleInput = {
			title: options.title,
			bodyMarkdown: options.body,
			coverImageUrl: options.coverImage,
			description: options.description,
			canonicalUrl: options.canonicalUrl,
			series: options.series,
		};
		if (options.tags !== undefined) {
			input.tags = ArticleOptions._parseTags(options.tags);
		}
		if (options.publish === true) {
			input.published = true;
		}
		if (options.draft === true) {
			input.published = false;
		}
		if (options.publishAt !== undefined) {
			input.publishedAt = ArticleOptions._parseFutureDate(options.publishAt, now);
		}
		return input;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Split the tags, and check that there are at most 4 tags.
	 *
	 * @param tagsStr The tags, separated by commas.
	 * @returns The tags.
	 */
	private static _parseTags(tagsStr: string): string[] {
		const tags = tagsStr.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
		if (tags.length > 4) {
			throw new Error(`dev.to accepts at most 4 tags, and you gave ${tags.length} tags.`);
		}
		return tags;
	}

	/**
	 * Parse a publication date, and check that the date is in the future.
	 *
	 * @param dateStr The date, in a format that `Date` reads, for example `2026-12-01T09:00:00Z`.
	 * @param now The current date.
	 * @returns The date, as an ISO 8601 string.
	 */
	private static _parseFutureDate(dateStr: string, now: Date): string {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) {
			throw new Error(`The publication date "${dateStr}" is not a valid date.`);
		}
		if (date.getTime() <= now.getTime()) {
			throw new Error(`The publication date "${dateStr}" is not in the future.`);
		}
		return date.toISOString();
	}
}
