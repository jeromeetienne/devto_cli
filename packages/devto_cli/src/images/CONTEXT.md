# Directory Context: `/packages/devto_cli/src/images`

## Purpose
Upload the local image files to dev.to: the cover image, and the images of a Markdown text.

## Key Exports & Entry Points
- `image_uploader.ts`: `ImageUploader`, with `uploadFile`, `resolveCoverImage`, `uploadMarkdownImages`, and `contentTypeOf`.
- `markdown_images.ts`: `MarkdownImages`, which finds and replaces the paths of the images of a Markdown text, without input or output.

## Rules
- Nothing here imports from `../commands`, `../config`, or `../formatters`.
- `ImageUploader` takes only the `uploadImage` method of the client (`ImageUploadClient`), so that a test gives a fake client.
- An address (`https://…`, `data:…`, `//…`) is never uploaded; only a local path is.
- Each file is uploaded one time, even when the text names it several times.
- A relative path in a Markdown text starts from the folder of the Markdown file.
