# Directory Context: `/packages/devto_cli/src/formatters`

## Purpose
Write the results of the commands in the output formats `json`, `markdown`, and `tty` (text for the terminal, with Chalk colors).

## Key Exports & Entry Points
- `output_format.ts`: `OutputFormat.parse`, the type `OutputFormatName`, the help of `--format`, and the shared helpers `toJson` and `markdownTable`.
- `article_formatter.ts`: `ArticleFormatter`, the lists, the details, the previews, and the status (`draft`, `scheduled`, `published`) of the articles.
- `comment_formatter.ts`: `CommentFormatter`, the comments with their answers indented.
- `analytics_formatter.ts`: `AnalyticsFormatter`, the totals, the days, and the referrers.
- `result_formatter.ts`: `ResultFormatter`, the result of an image upload.
- `html_text.ts`: `HtmlText.toPlainText`, the HTML of dev.to as plain text.

## Rules
- Nothing here imports from `../commands`, `../config`, or `../images`; only the types of `../api`.
- A formatter gives a string, and never writes on the standard output.
- The format `json` gives the data of dev.to as it is, with all its fields.
- A function that depends on the current date takes it as a parameter, so that a test is the same every day.
