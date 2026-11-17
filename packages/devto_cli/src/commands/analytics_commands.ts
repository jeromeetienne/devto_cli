import type { Command } from 'commander';
import type { DevtoAnalyticsQuery } from '../api/devto_engagement_types.js';
import { AnalyticsFormatter } from '../formatters/analytics_formatter.js';
import { OutputFormat } from '../formatters/output_format.js';
import { CommandClient } from './command_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	AnalyticsCommands — the commands analytics totals, historical, past_day, and referrers
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The options of the analytics commands, as Commander.js gives them.
 */
type AnalyticsOptions = {
	/** The identifier of the article, or undefined for all the articles of the user. */
	article?: string;
	/** The first day, `YYYY-MM-DD`. */
	start?: string;
	/** The last day, `YYYY-MM-DD`. */
	end?: string;
	/** The output format. */
	format: string;
};

/**
 * The commands `analytics totals`, `analytics historical`, `analytics past_day`, and `analytics referrers`.
 */
export class AnalyticsCommands {
	/**
	 * Add the analytics commands to the program.
	 *
	 * @param program The Commander.js program.
	 * @returns Nothing.
	 */
	static register(program: Command): void {
		const analyticsCommand = program
			.command('analytics')
			.description('read the analytics of the user, or of one article');

		analyticsCommand
			.command('totals')
			.description('the totals of the page views, the reactions, the comments, and the follows')
			.option('--article <articleId>', 'only this article')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (options: AnalyticsOptions) => {
				const format = OutputFormat.parse(options.format);
				const query = AnalyticsCommands.toQuery(options);
				const client = await CommandClient.create();
				console.log(AnalyticsFormatter.formatTotals(await client.getAnalyticsTotals(query), format));
			});

		analyticsCommand
			.command('historical')
			.description('the analytics of each day, from a start date')
			.requiredOption('--start <start>', 'the first day, YYYY-MM-DD')
			.option('--end <end>', 'the last day, YYYY-MM-DD; the default is today')
			.option('--article <articleId>', 'only this article')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (options: AnalyticsOptions) => {
				const format = OutputFormat.parse(options.format);
				const query = AnalyticsCommands.toQuery(options);
				const client = await CommandClient.create();
				console.log(AnalyticsFormatter.formatDaily(await client.getAnalyticsHistorical(query), format));
			});

		analyticsCommand
			.command('past_day')
			.description('the analytics of the past day')
			.option('--article <articleId>', 'only this article')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (options: AnalyticsOptions) => {
				const format = OutputFormat.parse(options.format);
				const query = AnalyticsCommands.toQuery(options);
				const client = await CommandClient.create();
				console.log(AnalyticsFormatter.formatDaily(await client.getAnalyticsPastDay(query), format));
			});

		analyticsCommand
			.command('referrers')
			.description('the domains that sent readers')
			.option('--start <start>', 'the first day, YYYY-MM-DD')
			.option('--end <end>', 'the last day, YYYY-MM-DD')
			.option('--article <articleId>', 'only this article')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (options: AnalyticsOptions) => {
				const format = OutputFormat.parse(options.format);
				const query = AnalyticsCommands.toQuery(options);
				const client = await CommandClient.create();
				console.log(AnalyticsFormatter.formatReferrers(await client.getAnalyticsReferrers(query), format));
			});
	}

	/**
	 * Check the options of an analytics command, and change them into the filters of the API.
	 *
	 * @param options The options of the command line.
	 * @returns The filters.
	 */
	static toQuery(options: AnalyticsOptions): DevtoAnalyticsQuery {
		const query: DevtoAnalyticsQuery = {};
		if (options.article !== undefined) {
			query.articleId = CommandClient.parsePositiveInteger(options.article, 'article identifier');
		}
		if (options.start !== undefined) {
			query.start = AnalyticsCommands._parseDay(options.start, 'start');
		}
		if (options.end !== undefined) {
			query.end = AnalyticsCommands._parseDay(options.end, 'end');
		}
		return query;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Check that a day has the form `YYYY-MM-DD`.
	 *
	 * @param dayStr The day.
	 * @param name The name of the option, for the error message.
	 * @returns The day.
	 */
	private static _parseDay(dayStr: string, name: string): string {
		if (/^\d{4}-\d{2}-\d{2}$/.test(dayStr) === false || Number.isNaN(new Date(dayStr).getTime()) === true) {
			throw new Error(`The ${name} day "${dayStr}" does not have the form YYYY-MM-DD.`);
		}
		return dayStr;
	}
}
