import Fs from 'node:fs';
import Path from 'node:path';
import type { DevtoClient } from '../api/devto_client.js';
import { MarkdownImages } from './markdown_images.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ImageUploader — uploads the local image files to dev.to, and gives their addresses
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The part of `DevtoClient` that the uploader needs, so that a test can give a fake client.
 */
export type ImageUploadClient = Pick<DevtoClient, 'uploadImage'>;

/**
 * The function that the uploader calls after each upload, for example to write a message.
 */
export type UploadReportFn = (filePath: string, address: string) => void;

/**
 * The media type of each image extension that dev.to accepts.
 */
const CONTENT_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
};

/**
 * Uploads the local image files to dev.to, each file one time.
 */
export class ImageUploader {
	/** The client that uploads the images. */
	private readonly _client: ImageUploadClient;
	/** The function that the uploader calls after each upload. */
	private readonly _reportFn: UploadReportFn;
	/** The address of each uploaded file, by absolute path. */
	private readonly _addresses = new Map<string, string>();

	/**
	 * @param client The client that uploads the images.
	 * @param reportFn The function that the uploader calls after each upload.
	 */
	constructor(client: ImageUploadClient, reportFn: UploadReportFn) {
		this._client = client;
		this._reportFn = reportFn;
	}

	/**
	 * Upload one image file.
	 *
	 * @param filePath The path of the file.
	 * @returns The address of the uploaded image.
	 */
	async uploadFile(filePath: string): Promise<string> {
		const absolutePath = Path.resolve(filePath);
		const knownAddress = this._addresses.get(absolutePath);
		if (knownAddress !== undefined) {
			return knownAddress;
		}

		const contentType = ImageUploader.contentTypeOf(absolutePath);
		const data = await Fs.promises.readFile(absolutePath);
		const image = await this._client.uploadImage(Path.basename(absolutePath), data, contentType);
		this._addresses.set(absolutePath, image.url);
		this._reportFn(filePath, image.url);
		return image.url;
	}

	/**
	 * Give the address of a cover image: an address stays as it is, a local file is uploaded.
	 *
	 * @param coverImage The address or the path of the cover image.
	 * @param baseDir The folder from which a relative path starts.
	 * @returns The address of the cover image.
	 */
	async resolveCoverImage(coverImage: string, baseDir: string): Promise<string> {
		if (MarkdownImages.isLocalPath(coverImage) === false) {
			return coverImage;
		}
		return await this.uploadFile(Path.resolve(baseDir, coverImage));
	}

	/**
	 * Upload each local image of a Markdown text, and replace its path with its address.
	 *
	 * @param markdown The Markdown text.
	 * @param baseDir The folder from which a relative path starts, usually the folder of the Markdown file.
	 * @returns The Markdown text with the addresses.
	 */
	async uploadMarkdownImages(markdown: string, baseDir: string): Promise<string> {
		const replacements = new Map<string, string>();
		for (const imagePath of MarkdownImages.findLocalPaths(markdown)) {
			const address = await this.uploadFile(Path.resolve(baseDir, imagePath));
			replacements.set(imagePath, address);
		}
		return MarkdownImages.replacePaths(markdown, replacements);
	}

	/**
	 * Give the media type of an image file from its extension.
	 *
	 * @param filePath The path of the file.
	 * @returns The media type.
	 */
	static contentTypeOf(filePath: string): string {
		const extension = Path.extname(filePath).toLowerCase();
		const contentType = CONTENT_TYPES[extension];
		if (contentType === undefined) {
			const extensions = Object.keys(CONTENT_TYPES).join(', ');
			throw new Error(`The image "${filePath}" has the extension "${extension}"; use one of ${extensions}.`);
		}
		return contentType;
	}
}
