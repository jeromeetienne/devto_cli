///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	HtmlText — changes the HTML that dev.to sends into plain text for the terminal
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The character of each HTML entity that dev.to uses.
 */
const ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': '\'',
	'&nbsp;': ' ',
};

/**
 * Changes HTML into plain text.
 */
export class HtmlText {
	/**
	 * Change HTML into plain text: the paragraphs and the line breaks become new lines, the tags are removed.
	 *
	 * @param html The HTML.
	 * @returns The plain text.
	 */
	static toPlainText(html: string): string {
		const text = html
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/(p|div|h[1-6]|li|pre|blockquote)>/gi, '\n')
			.replace(/<[^>]+>/g, '')
			.replace(/&#(\d+);/g, (whole: string, code: string) => String.fromCodePoint(Number(code)))
			.replace(/&[a-z]+;|&#39;/gi, (entity: string) => ENTITIES[entity] ?? entity);
		return text
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}
}
