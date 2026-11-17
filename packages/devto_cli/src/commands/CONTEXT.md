# Directory Context: `/packages/devto_cli/src/commands`

## Purpose
The commands of the command line: `login`, `status`, `logout`, `create`, `update`, and `list`.

## Key Exports & Entry Points
- `auth_commands.ts`: `AuthCommands.register`, the commands `login`, `status`, and `logout`.
- `article_commands.ts`: `ArticleCommands.register`, the commands `create`, `update`, and `list`.
- `article_formatter.ts`: `ArticleFormatter`, the output formats `json`, `markdown`, and `tty` (with Chalk colors) of the option `--format`.
- `article_options.ts`: `ArticleOptions.toArticleInput`, the check of the options, without input or output, so that a test can call it.

## Rules
- Each command file has one static class with a `register(program)` method that `../cli.ts` calls.
- The check of the options stays in `article_options.ts`, never in the action of a command.
- A command reads the API key only through `CredentialStore`.

## Background
- A command without `--publish` and without `--publish-at` creates a draft, so that a mistake never publishes an article.
