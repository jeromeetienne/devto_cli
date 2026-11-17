import Fs from 'node:fs';
import Path from 'node:path';
import type { Command } from 'commander';
import { OutputFormat } from '../formatters/output_format.js';
import { ResultFormatter } from '../formatters/result_formatter.js';
import { ImageUploader } from '../images/image_uploader.js';
import { CommandClient } from './command_client.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ImageCommands — the command image upload
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The command `image upload`.
 */
export class ImageCommands {
	/**
	 * Add the command `image upload` to the program.
	 *
	 * @param program The Commander.js program.
	 * @returns Nothing.
	 */
	static register(program: Command): void {
		const imageCommand = program
			.command('image')
			.description('upload images to dev.to');

		imageCommand
			.command('upload')
			.description('upload an image file, and write its address; the image is public')
			.argument('<file>', 'the image file: .png, .jpg, .jpeg, .gif, or .webp')
			.option('--format <format>', OutputFormat.HELP, 'tty')
			.action(async (filePath: string, options: { format: string }) => {
				const format = OutputFormat.parse(options.format);
				const contentType = ImageUploader.contentTypeOf(filePath);
				const client = await CommandClient.create();
				const data = await Fs.promises.readFile(filePath);
				const fileName = Path.basename(filePath);
				const image = await client.uploadImage(fileName, data, contentType);
				console.log(ResultFormatter.formatImage(image, fileName, format));
			});
	}
}
