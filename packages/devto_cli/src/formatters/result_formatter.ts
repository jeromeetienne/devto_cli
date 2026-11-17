import Chalk from 'chalk';
import type { DevtoImage } from '../api/devto_types.js';
import { OutputFormat } from './output_format.js';
import type { OutputFormatName } from './output_format.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ResultFormatter — writes the result of an image upload
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Writes the result of an image upload in one output format.
 */
export class ResultFormatter {
	/**
	 * Write the result of an image upload.
	 *
	 * @param image The uploaded image.
	 * @param fileName The name of the uploaded file, used as the alt text in Markdown.
	 * @param format The output format.
	 * @returns The text to write on the standard output.
	 */
	static formatImage(image: DevtoImage, fileName: string, format: OutputFormatName): string {
		if (format === 'json') {
			return OutputFormat.toJson(image);
		}
		if (format === 'markdown') {
			return `![${fileName}](${image.url})`;
		}
		return Chalk.blue.underline(image.url);
	}
}
