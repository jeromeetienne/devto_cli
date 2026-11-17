---
name: devto_cli
description: Create, update, schedule, and list dev.to articles with the command line devto_cli, with the API key stored one time by the command login. Use it when the developer asks to post an article on dev.to as a draft, to publish it now or at a future date, to add a cover image, to update an article, or to list the articles.
---

# devto_cli

`devto_cli` is a command-line client of the [dev.to API](https://developers.forem.com/api). Run every command with `npx devto_cli`.

## Login

Run the command `login` one time. The command checks the API key with dev.to, then stores the API key in `~/.config/devto_cli/credentials.json`. Every other command reads the API key from that file.

```bash
printf '%s' "$DEVTO_API_KEY" | npx devto_cli login
```

Never write the API key in a repository, in an issue, in a commit, or in a log message.

## Create an article

Without `--publish` and without `--publish-at`, the article is a draft.

```bash
npx devto_cli create --title "My title" --body-file ./article.md --tags "typescript,cli" --cover-image https://example.com/cover.png
```

- Publish now: add `--publish`.
- Publish at a future date: add `--publish-at 2026-12-01T09:00:00Z`.
- Add a cover image: `--cover-image <address of the image>`. The dev.to API takes the address of an image, not a file.
- Add an image in the text: write `![Alt text](<address of the image>)` in the Markdown file.

## Update an article

```bash
npx devto_cli update <article identifier> --title "New title"
```

The command `update` takes the same options as the command `create`, and `--draft` to change a published article back into a draft.

## List the articles

```bash
npx devto_cli list --filter unpublished
```

The filter is `all`, `published`, or `unpublished`. Each line gives the identifier, the status, the title, the address, and the cover image. Add `--json` for JSON.

## Rules

- Before you publish an article, or schedule an article, ask the developer.
- To test, create a draft only.
