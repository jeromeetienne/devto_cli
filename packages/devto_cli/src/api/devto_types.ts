import { z } from 'zod';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoTypes — the shapes of the data that the dev.to API sends and receives
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
});

/**
 * The user that owns the API key.
 */
export type DevtoUser = z.infer<typeof DevtoUserSchema>;

/**
 * One article, as the dev.to API returns it.
 */
export const DevtoArticleSchema = z.object({
	/** The identifier of the article. */
	id: z.number(),
	/** The title of the article. */
	title: z.string(),
	/** The address of the article on dev.to. */
	url: z.string().nullable().optional(),
	/** True when the article is published, false when the article is a draft. */
	published: z.boolean().optional(),
	/** The publication date, or null for a draft. */
	published_at: z.string().nullable().optional(),
	/** The address of the cover image, or null when the article has no cover image. */
	cover_image: z.string().nullable().optional(),
});

/**
 * One article, as the dev.to API returns it.
 */
export type DevtoArticle = z.infer<typeof DevtoArticleSchema>;

/**
 * A list of articles, as the dev.to API returns it.
 */
export const DevtoArticleListSchema = z.array(DevtoArticleSchema);

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
