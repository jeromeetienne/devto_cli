///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OutputFormat — the names of the output formats, and the helpers that all the formatters share
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The name of an output format of the option `--format`.
 */
export type OutputFormatName = 'json' | 'markdown' | 'tty';

/**
 * The names of the output formats, and the helpers that all the formatters share.
 */
export class OutputFormat {
	/** The names of the output formats, in the order that the help of the command line shows them. */
	static readonly NAMES: readonly OutputFormatName[] = [
		'json',
		'markdown',
		'tty',
	];

	/** The text of the help of the option `--format`. */
	static readonly HELP = 'the output format: json, markdown, or tty; tty adds colors for the terminal';

	/**
	 * Check the value of the option `--format`.
	 *
	 * @param formatStr The value of the option.
	 * @returns The name of the output format.
	 */
	static parse(formatStr: string): OutputFormatName {
		const format = OutputFormat.NAMES.find((formatName) => formatName === formatStr);
		if (format === undefined) {
			throw new Error(`The format "${formatStr}" is not one of ${OutputFormat.NAMES.join(', ')}.`);
		}
		return format;
	}

	/**
	 * Write a value as JSON, with tabs.
	 *
	 * @param value The value.
	 * @returns The JSON text.
	 */
	static toJson(value: unknown): string {
		return JSON.stringify(value, null, '\t');
	}

	/**
	 * Write a Markdown table.
	 *
	 * @param headers The headers of the columns.
	 * @param rows The cells of each row.
	 * @returns The Markdown table.
	 */
	static markdownTable(headers: string[], rows: string[][]): string {
		const lines = [
			`| ${headers.join(' | ')} |`,
			`|${headers.map(() => '---').join('|')}|`,
		];
		for (const row of rows) {
			lines.push(`| ${row.map((cell) => OutputFormat._escapeCell(cell)).join(' | ')} |`);
		}
		return lines.join('\n');
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Escape the characters that break a cell of a Markdown table.
	 *
	 * @param text The text of the cell.
	 * @returns The escaped text.
	 */
	private static _escapeCell(text: string): string {
		return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
	}
}
