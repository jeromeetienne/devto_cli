# Directory Context: `/packages/devto_cli/src/api`

## Purpose
Send the requests of the dev.to API, and check each response with a Zod schema.

## Key Exports & Entry Points
- `devto_client.ts`: `DevtoClient`, with the methods of the user, the articles (create, update, get, list, preview, search, semantic search, list of the published articles), the images, the comments, and the analytics.
- `devto_types.ts`: the Zod schemas and the types of the users, the articles, the previews, and the images.
- `devto_engagement_types.ts`: the Zod schemas and the types of the comments and the analytics.
- `devto_api_error.ts`: `DevtoApiError`, the error of a refused request, with the HTTP status.

## Rules
- Nothing here imports from `../commands`, `../config`, `../formatters`, or `../images`.
- `DevtoClient` takes the API key, the fetch function, and the wait function as options; it never reads a file.
- An answer 429 is retried 3 times, after the `retry-after` header or after a wait that doubles.
- A schema of a response uses `.passthrough()`, so that the format `json` keeps all the fields that dev.to sends.
- A field is optional in a schema unless every endpoint sends it.
- Add no method for an operation that dev.to refuses for an API key: reactions, unpublish, and the search of the users answer 401.

## Background
- The dev.to API takes the address of a cover image (`main_image`); `POST /images` uploads a file and gives its address.
- A future `published_at` with `published: true` schedules an article.
- `GET /articles/{id}` answers 404 for a draft, so `getArticle` then looks in `GET /articles/me/all`.
