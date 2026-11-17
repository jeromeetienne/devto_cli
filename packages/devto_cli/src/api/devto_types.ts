import { z } from 'zod';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoTypes — the shapes of the users, the articles, and the images of the dev.to API
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The user that owns the API key, as `GET /api/users/me` returns it.
 */
export const DevtoUserSchema = z.object({
	/** The identifier of the user. */
	id: z.number(),
	/** The username of the user, without the `@`. */
	username: z.string(),
	/** The display name of the user. */
	name: z.string().nullable().optional(),
}).passthrough();

/**
 * The user that owns the API key.
 */
export type DevtoUser = z.infer<typeof DevtoUserSchema>;

/**
 * One article, as the dev.to API returns it. The fields that are not named here are kept, for the format `json`.
 */
export const DevtoArticleSchema = z.object({
	/** The identifier of the article. */
	id: z.number(),
	/** The title of the article. */
	title: z.string(),
	/** The address of the article on dev.to. */
	url: z.string().nullable().optional(),
	/** True when the article is published, false when the article is a draft. Some endpoints do not send it. */
	published: z.boolean().optional(),
	/** The publication date, or null for a draft. */
	published_at: z.string().nullable().optional(),
	/** The address of the cover image, or null when the article has no cover image. */
	cover_image: z.string().nullable().optional(),
	/** The address of the cover image, as the semantic search sends it. */
	main_image: z.string().nullable().optional(),
	/** The description of the article. */
	description: z.string().nullable().optional(),
	/** The tags, as one string separated by commas, or as a list. */
	tag_list: z.union([
		z.string(),
		z.array(z.string()),
	]).optional(),
	/** The text of the article, in Markdown. Only some endpoints send it. */
	body_markdown: z.string().nullable().optional(),
	/** The author of the article. */
	user: z.object({
		/** The username of the author. */
		username: z.string(),
	}).passthrough().optional(),
}).passthrough();

/**
 * One article, as the dev.to API returns it.
 */
export type DevtoArticle = z.infer<typeof DevtoArticleSchema>;

/**
 * A list of articles, as the dev.to API returns it.
 */
export const DevtoArticleListSchema = z.array(DevtoArticleSchema);

/**
 * The preview of an article, as `POST /api/articles/preview` returns it.
 */
export const DevtoArticlePreviewSchema = z.object({
	/** The HTML of the text of the article. */
	body_html: z.string(),
	/** The title of the article, from the front matter, or null. */
	title: z.string().nullable().optional(),
	/** The estimated time to read the article, in minutes. */
	reading_time_minutes: z.number().optional(),
}).passthrough();

/**
 * The preview of an article.
 */
export type DevtoArticlePreview = z.infer<typeof DevtoArticlePreviewSchema>;

/**
 * The uploaded image, as `POST /api/images` returns it.
 */
export const DevtoImageSchema = z.object({
	/** The address of the uploaded image. */
	url: z.string(),
}).passthrough();

/**
 * The uploaded image.
 */
export type DevtoImage = z.infer<typeof DevtoImageSchema>;

/**
 * The values of an article that the caller creates or updates. An undefined value is not sent.
 */
export type DevtoArticleInput = {
	/** The title of the article. */
	title?: string;
	/** The text of the article, in Markdown. */
	bodyMarkdown?: string;
	/** True to publish the article, false to keep the article as a draft. */
	published?: boolean;
	/** The publication date, as an ISO 8601 string. A future date schedules the article. */
	publishedAt?: string;
	/** The address of the cover image. */
	coverImageUrl?: string;
	/** The tags of the article, at most 4. */
	tags?: string[];
	/** The description of the article. */
	description?: string;
	/** The canonical address of the article, when the article was first published elsewhere. */
	canonicalUrl?: string;
	/** The name of the series of the article. */
	series?: string;
};

/**
 * The filter of the articles of the user.
 */
export type DevtoArticleFilter = 'all' | 'published' | 'unpublished';

/**
 * The page of a list.
 */
export type DevtoPage = {
	/** The page number, from 1. */
	page?: number;
	/** The number of items on each page. */
	perPage?: number;
};

/**
 * The filters of the list of the published articles of all the users.
 */
export type DevtoPublishedArticleQuery = DevtoPage & {
	/** Only the articles with this tag. */
	tag?: string;
	/** Only the articles of this user or of this organization. */
	username?: string;
	/** Only the most popular articles of the last N days. */
	top?: number;
};
