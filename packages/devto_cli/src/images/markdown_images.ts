///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MarkdownImages — finds and replaces the local images of a Markdown text
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The Markdown image `![alt](path "title")`: group 1 is the alt text, group 2 is the path, group 3 is the title.
 */
const IMAGE_PATTERN = /!\[([^\]]*)\]\(\s*([^)\s]+)(\s+"[^"]*")?\s*\)/g;

/**
 * Finds and replaces the local images of a Markdown text, without input or output.
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
		for (const match of markdown.matchAll(IMAGE_PATTERN)) {
			const imagePath = match[2];
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
		return markdown.replace(IMAGE_PATTERN, (whole: string, alt: string, imagePath: string, title?: string) => {
			const address = replacements.get(imagePath);
			if (address === undefined) {
				return whole;
			}
			return `![${alt}](${address}${title ?? ''})`;
		});
	}
}
