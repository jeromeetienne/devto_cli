import { z } from 'zod';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	DevtoEngagementTypes — the shapes of the comments and the analytics of the dev.to API
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * One comment, with its answers, as `GET /api/comments` returns it.
 */
export type DevtoComment = {
	/** The identifier of the comment, made of letters and digits. */
	id_code: string;
	/** The HTML of the text of the comment. */
	body_html: string;
	/** The creation date of the comment. */
	created_at: string;
	/** The author of the comment. Null when the author deleted the account. */
	user: {
		/** The username of the author. */
		username: string;
		/** The display name of the author. */
		name?: string | null;
	} | null;
	/** The answers to the comment. */
	children: DevtoComment[];
};

/**
 * One comment, with its answers.
 */
export const DevtoCommentSchema: z.ZodType<DevtoComment, z.ZodTypeDef, unknown> = z.lazy(() => z.object({
	id_code: z.string(),
	body_html: z.string(),
	created_at: z.string(),
	user: z.object({
		username: z.string(),
		name: z.string().nullable().optional(),
	}).nullable(),
	children: z.array(DevtoCommentSchema).default([]),
}));

/**
 * A list of comments.
 */
export const DevtoCommentListSchema = z.array(DevtoCommentSchema);

/**
 * The totals of the analytics, for the user, for one article, or for one day.
 */
export const DevtoAnalyticsTotalsSchema = z.object({
	/** The number of comments. */
	comments: z.object({
		/** The total. */
		total: z.number(),
	}).passthrough(),
	/** The number of new followers. */
	follows: z.object({
		/** The total. */
		total: z.number(),
	}).passthrough(),
	/** The number of reactions, in total and by category. */
	reactions: z.object({
		/** The total. */
		total: z.number(),
	}).passthrough(),
	/** The number of page views and the read time. */
	page_views: z.object({
		/** The total. */
		total: z.number(),
		/** The average read time, in seconds. */
		average_read_time_in_seconds: z.number().optional(),
		/** The total read time, in seconds. */
		total_read_time_in_seconds: z.number().optional(),
	}).passthrough(),
}).passthrough();

/**
 * The totals of the analytics.
 */
export type DevtoAnalyticsTotals = z.infer<typeof DevtoAnalyticsTotalsSchema>;

/**
 * The totals of the analytics for each day, with the date `YYYY-MM-DD` as the key.
 */
export const DevtoAnalyticsDailySchema = z.record(z.string(), DevtoAnalyticsTotalsSchema);

/**
 * The totals of the analytics for each day.
 */
export type DevtoAnalyticsDaily = z.infer<typeof DevtoAnalyticsDailySchema>;

/**
 * The domains that sent readers.
 */
export const DevtoAnalyticsReferrersSchema = z.object({
	/** One item for each domain. */
	domains: z.array(z.object({
		/** The domain, or null for the direct visits. */
		domain: z.string().nullable().optional(),
		/** The number of visits. */
		count: z.number().optional(),
	}).passthrough()),
}).passthrough();

/**
 * The domains that sent readers.
 */
export type DevtoAnalyticsReferrers = z.infer<typeof DevtoAnalyticsReferrersSchema>;

/**
 * The filters of the analytics.
 */
export type DevtoAnalyticsQuery = {
	/** Only this article. */
	articleId?: number;
	/** The first day, `YYYY-MM-DD`. */
	start?: string;
	/** The last day, `YYYY-MM-DD`. */
	end?: string;
};
