import Assert from 'node:assert/strict';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Test from 'node:test';
import type { DevtoImage } from '../src/api/devto_types.js';
import { ImageUploader } from '../src/images/image_uploader.js';
import type { ImageUploadClient } from '../src/images/image_uploader.js';
import { MarkdownImages } from '../src/images/markdown_images.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ImagesTest — checks the upload of the local cover image and of the local images of a Markdown text
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * A fake client that records each upload, and answers with an address made from the file name.
 */
class FakeImageClient {
	/** The name of each uploaded file, in order. */
	readonly uploadedFileNames: string[] = [];

	/**
	 * Give the fake client.
	 *
	 * @returns The fake client.
	 */
	get client(): ImageUploadClient {
		return {
			uploadImage: async (fileName: string): Promise<DevtoImage> => {
				this.uploadedFileNames.push(fileName);
				return {
					url: `https://cdn.example.com/${fileName}`,
				};
			},
		};
	}
}

Test.test('isLocalPath tells a local file from an address', () => {
	Assert.equal(MarkdownImages.isLocalPath('./images/a.png'), true);
	Assert.equal(MarkdownImages.isLocalPath('a.png'), true);
	Assert.equal(MarkdownImages.isLocalPath('https://example.com/a.png'), false);
	Assert.equal(MarkdownImages.isLocalPath('data:image/png;base64,AAAA'), false);
	Assert.equal(MarkdownImages.isLocalPath('//example.com/a.png'), false);
});

Test.test('findLocalPaths gives each local path one time, and replacePaths keeps the alt text and the title', () => {
	const markdown = [
		'![One](./a.png "The title")',
		'![Two](https://example.com/b.png)',
		'![Again](./a.png)',
	].join('\n');
	Assert.deepEqual(MarkdownImages.findLocalPaths(markdown), [
		'./a.png',
	]);
	const replaced = MarkdownImages.replacePaths(markdown, new Map([
		['./a.png', 'https://cdn.example.com/a.png'],
	]));
	Assert.equal(replaced, [
		'![One](https://cdn.example.com/a.png "The title")',
		'![Two](https://example.com/b.png)',
		'![Again](https://cdn.example.com/a.png)',
	].join('\n'));
});

Test.test('uploadMarkdownImages uploads each local file one time, from the folder of the Markdown file', async () => {
	const baseDir = await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli-'));
	await Fs.promises.mkdir(Path.join(baseDir, 'images'));
	await Fs.promises.writeFile(Path.join(baseDir, 'images', 'a.png'), 'fake png');
	const fakeImageClient = new FakeImageClient();
	const reports: string[] = [];
	const imageUploader = new ImageUploader(fakeImageClient.client, (filePath: string) => {
		reports.push(filePath);
	});
	const markdown = '![A](images/a.png) and ![A again](./images/a.png)';
	const replaced = await imageUploader.uploadMarkdownImages(markdown, baseDir);
	Assert.equal(replaced, '![A](https://cdn.example.com/a.png) and ![A again](https://cdn.example.com/a.png)');
	Assert.deepEqual(fakeImageClient.uploadedFileNames, [
		'a.png',
	]);
	Assert.equal(reports.length, 1);
});

Test.test('resolveCoverImage keeps an address, and uploads a local file', async () => {
	const baseDir = await Fs.promises.mkdtemp(Path.join(Os.tmpdir(), 'devto_cli-'));
	await Fs.promises.writeFile(Path.join(baseDir, 'cover.jpg'), 'fake jpg');
	const fakeImageClient = new FakeImageClient();
	const imageUploader = new ImageUploader(fakeImageClient.client, () => {});
	Assert.equal(await imageUploader.resolveCoverImage('https://example.com/c.png', baseDir), 'https://example.com/c.png');
	Assert.equal(await imageUploader.resolveCoverImage('cover.jpg', baseDir), 'https://cdn.example.com/cover.jpg');
});

Test.test('contentTypeOf gives the media type, and refuses an unknown extension', () => {
	Assert.equal(ImageUploader.contentTypeOf('a.JPG'), 'image/jpeg');
	Assert.equal(ImageUploader.contentTypeOf('a.webp'), 'image/webp');
	Assert.throws(() => {
		ImageUploader.contentTypeOf('a.bmp');
	}, /extension/);
});

Test.test('findLocalPaths and replacePaths skip the images inside inline code and inside fenced code blocks', () => {
	const markdown = [
		'Write `![diagram](./diagram.png)` in your file, or ``![x](./x.png)``.',
		'```markdown',
		'![fenced](./fenced.png)',
		'```',
		'~~~',
		'![tilde](./tilde.png)',
		'~~~',
		'![Real](./real.png)',
	].join('\n');
	Assert.deepEqual(MarkdownImages.findLocalPaths(markdown), [
		'./real.png',
	]);
	const replaced = MarkdownImages.replacePaths(markdown, new Map([
		['./diagram.png', 'https://cdn.example.com/diagram.png'],
		['./fenced.png', 'https://cdn.example.com/fenced.png'],
		['./real.png', 'https://cdn.example.com/real.png'],
	]));
	Assert.equal(replaced, markdown.replace('./real.png', 'https://cdn.example.com/real.png'));
});
