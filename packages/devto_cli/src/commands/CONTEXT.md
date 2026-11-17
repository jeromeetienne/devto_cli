# Directory Context: `/packages/devto_cli/src/commands`

## Purpose
The commands of the command line, and the Commander.js program that holds them.

## Key Exports & Entry Points
- `program_factory.ts`: `ProgramFactory.create`, the program with every command; `../cli.ts` and the tests call it.
- `auth_commands.ts`: `login` (asks for the hidden API key in a terminal, else reads the standard input), `status`, and `logout`.
- `article_commands.ts`: `create`, `update`, `get`, `preview`, and `list`; `create` and `update` upload the local images.
- `image_commands.ts`: `image upload`.
- `comment_commands.ts`: `comment list` and `comment get`.
- `analytics_commands.ts`: `analytics totals`, `historical`, `past_day`, and `referrers`.
- `search_commands.ts`: `search articles` (with `--semantic`) and `search published`.
- `article_options.ts`: `ArticleOptions.toArticleInput`, the check of the options of an article.
- `command_client.ts`: `CommandClient.create` and `loadApiKey`, the API key of `DEVTO_API_KEY` or else the stored API key, and `parsePositiveInteger`.

## Rules
- Each command file has one static class with a `register(program)` method that `program_factory.ts` calls.
- Every command that writes a result has `--format`, and writes it through a class of `../formatters`.
- The check of the options stays in a static method that a test can call, never only in the action of a command.
- A command reads the API key only through `CommandClient`.
- The API key is never an option of the command line, because the shell history and the process list keep the options.
- A message that is not the result, such as an upload report, goes to the standard error, so that `--format json` stays valid.

## Background
- A command without `--publish` and without `--publish-at` creates a draft, so that a mistake never publishes an article.
