///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MarkdownImages — finds and replaces the local images of a Markdown text
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * A fenced code block, an inline code span, or a Markdown image `![alt](path "title")`. The group `code` holds a
 * fenced code block or an inline code span, so that an image inside code is not an image. Else, the groups `alt`,
 * `path`, and `title` hold the parts of the image.
 */
const CODE_OR_IMAGE_PATTERN = new RegExp([
	'(?<code>',
	'^ {0,3}(?<fence>`{3,}|~{3,})[^\\n]*\\n[\\s\\S]*?(?:^ {0,3}\\k<fence>[`~]*[ \\t]*$|(?![\\s\\S]))',
	'|(?<!`)(?<ticks>`+)[^`][\\s\\S]*?(?<!`)\\k<ticks>(?!`)',
	')',
	'|!\\[(?<alt>[^\\]]*)\\]\\(\\s*(?<path>[^)\\s]+)(?<title>\\s+"[^"]*")?\\s*\\)',
].join(''), 'gm');

/**
 * One Markdown image of a text, outside of code.
 */
type MarkdownImage = {
	/** The position of the image in the text. */
	index: number;
	/** The whole text of the image. */
	whole: string;
	/** The alt text. */
	alt: string;
	/** The path of the image. */
	path: string;
	/** The title with its leading space, or an empty string. */
	title: string;
};

/**
 * Finds and replaces the local images of a Markdown text, without input or output. An image inside a fenced code
 * block or an inline code span is an example, not an image.
 */
export class MarkdownImages {
	/**
	 * Say whether an image path is a local file, and not an address such as `https://…` or `data:…`.
	 *
	 * @param imagePath The path of the image.
	 * @returns True when the path is a local file.
	 */
	static isLocalPath(imagePath: string): boolean {
		if (imagePath.startsWith('//') === true) {
			return false;
		}
		return /^[a-z][a-z0-9+.-]*:/i.test(imagePath) === false;
	}

	/**
	 * Find the paths of the local images of a Markdown text, each path one time, in the order of the text.
	 *
	 * @param markdown The Markdown text.
	 * @returns The local paths.
	 */
	static findLocalPaths(markdown: string): string[] {
		const paths: string[] = [];
		for (const markdownImage of MarkdownImages._findImages(markdown)) {
			const imagePath = markdownImage.path;
			if (MarkdownImages.isLocalPath(imagePath) === true && paths.includes(imagePath) === false) {
				paths.push(imagePath);
			}
		}
		return paths;
	}

	/**
	 * Replace the paths of the images of a Markdown text.
	 *
	 * @param markdown The Markdown text.
	 * @param replacements The new address of each path.
	 * @returns The Markdown text with the new addresses.
	 */
	static replacePaths(markdown: string, replacements: Map<string, string>): string {
		let result = '';
		let lastIndex = 0;
		for (const markdownImage of MarkdownImages._findImages(markdown)) {
			const address = replacements.get(markdownImage.path);
			if (address === undefined) {
				continue;
			}
			result += markdown.slice(lastIndex, markdownImage.index);
			result += `![${markdownImage.alt}](${address}${markdownImage.title})`;
			lastIndex = markdownImage.index + markdownImage.whole.length;
		}
		result += markdown.slice(lastIndex);
		return result;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Find the Markdown images of a text, in the order of the text, and skip each image inside code.
	 *
	 * @param markdown The Markdown text.
	 * @returns The images outside of code.
	 */
	private static _findImages(markdown: string): MarkdownImage[] {
		const markdownImages: MarkdownImage[] = [];
		for (const match of markdown.matchAll(CODE_OR_IMAGE_PATTERN)) {
			const groups = match.groups;
			if (groups === undefined || groups.code !== undefined || groups.path === undefined) {
				continue;
			}
			markdownImages.push({
				index: match.index,
				whole: match[0],
				alt: groups.alt ?? '',
				path: groups.path,
				title: groups.title ?? '',
			});
		}
		return markdownImages;
	}
}
