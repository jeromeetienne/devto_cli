# Directory Context: `/packages/devto_cli/src/api`

## Purpose
Send the requests of the dev.to API, and check each response with a Zod schema.

## Key Exports & Entry Points
- `devto_client.ts`: `DevtoClient`, with `getMe`, `createArticle`, `updateArticle`, and `listMyArticles`.
- `devto_types.ts`: the Zod schemas and the types of the users and of the articles.

## Rules
- Nothing here imports from `../commands` or from `../config`.
- `DevtoClient` takes the API key and the fetch function as options; it never reads a file.
- A field of an article is optional in a schema unless every endpoint returns it.

## Background
- The dev.to API takes the address of a cover image (`main_image`), not a file; a future `published_at` with `published: true` schedules an article.
