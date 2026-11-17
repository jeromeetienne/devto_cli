import Chalk from 'chalk';
import type {
	DevtoAnalyticsDaily,
	DevtoAnalyticsReferrers,
	DevtoAnalyticsTotals,
} from '../api/devto_engagement_types.js';
import { OutputFormat } from './output_format.js';
import type { OutputFormatName } from './output_format.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	AnalyticsFormatter — writes the analytics as JSON, as Markdown, or for the terminal
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The headers of the table of the analytics of each day.
 */
const DAILY_HEADERS = [
	'Date',
	'Page views',
	'Reactions',
	'Comments',
	'Follows',
];

/**
 * Writes the analytics in one output format.
 */
export class AnalyticsFormatter {
	/**
	 * Write the totals of the analytics.
	 *
	 * @param totals The totals.
	 * @param format The output format.
	 * @returns The text to write on the standard output.
	 */
	static formatTotals(totals: DevtoAnalyticsTotals, format: OutputFormatName): string {
		if (format === 'json') {
			return OutputFormat.toJson(totals);
		}
		const rows = [
			['Page views', String(totals.page_views.total)],
			['Average read time, in seconds', String(totals.page_views.average_read_time_in_seconds ?? 0)],
			['Reactions', String(totals.reactions.total)],
			['Comments', String(totals.comments.total)],
			['Follows', String(totals.follows.total)],
		];
		for (const [category, count] of Object.entries(totals.reactions)) {
			if (category !== 'total' && typeof count === 'number') {
				rows.push([`Reactions: ${category}`, String(count)]);
			}
		}
		if (format === 'markdown') {
			return OutputFormat.markdownTable([
				'Metric',
				'Value',
			], rows);
		}
		const width = Math.max(...rows.map((row) => row[0].length));
		return rows.map((row) => `${row[0].padEnd(width)}  ${Chalk.cyan(row[1])}`).join('\n');
	}

	/**
	 * Write the analytics of each day.
	 *
	 * @param daily The totals of each day.
	 * @param format The output format.
	 * @returns The text to write on the standard output.
	 */
	static formatDaily(daily: DevtoAnalyticsDaily, format: OutputFormatName): string {
		if (format === 'json') {
			return OutputFormat.toJson(daily);
		}
		const rows = Object.entries(daily).map(([date, totals]) => [
			date,
			String(totals.page_views.total),
			String(totals.reactions.total),
			String(totals.comments.total),
			String(totals.follows.total),
		]);
		if (format === 'markdown') {
			return OutputFormat.markdownTable(DAILY_HEADERS, rows);
		}
		return AnalyticsFormatter._ttyTable(DAILY_HEADERS, rows);
	}

	/**
	 * Write the domains that sent readers.
	 *
	 * @param referrers The domains.
	 * @param format The output format.
	 * @returns The text to write on the standard output.
	 */
	static formatReferrers(referrers: DevtoAnalyticsReferrers, format: OutputFormatName): string {
		if (format === 'json') {
			return OutputFormat.toJson(referrers);
		}
		const headers = [
			'Domain',
			'Visits',
		];
		const rows = referrers.domains.map((referrer) => [
			referrer.domain ?? 'direct',
			String(referrer.count ?? 0),
		]);
		if (format === 'markdown') {
			return OutputFormat.markdownTable(headers, rows);
		}
		if (rows.length === 0) {
			return Chalk.dim('No referrer.');
		}
		return AnalyticsFormatter._ttyTable(headers, rows);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Write a table for the terminal, with aligned columns and bold headers.
	 *
	 * @param headers The headers of the columns.
	 * @param rows The cells of each row.
	 * @returns The table, with the color codes of the terminal.
	 */
	private static _ttyTable(headers: string[], rows: string[][]): string {
		const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index].length)));
		const headerLine = headers.map((header, index) => Chalk.bold(header.padEnd(widths[index]))).join('  ');
		const lines = rows.map((row) => row.map((cell, index) => cell.padEnd(widths[index])).join('  ').trimEnd());
		return [headerLine, ...lines].join('\n');
	}
}
