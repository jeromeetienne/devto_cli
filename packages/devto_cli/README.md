# devto_cli package

The TypeScript package of `devto_cli`, the command line for [dev.to](https://dev.to). For what devto_cli does and how a coding agent uses it, read the [root README](../../README.md) and the [devto_cli skill](../../skills/devto_cli/SKILL.md).

## Run

From any folder, with no build and no npm registry:

```bash
npx --yes github:jeromeetienne/devto_cli --help
```

From this folder, on the source code:

```bash
pnpm dev --help
pnpm dev list --filter unpublished
```

`npx --yes github:jeromeetienne/devto_cli` starts [src/cli_launcher.mjs](src/cli_launcher.mjs), which runs [src/cli.ts](src/cli.ts) with tsx.

## Commands

| Group | Commands |
|---|---|
| Login | `login`, `status`, `logout` |
| Articles | `create`, `update`, `get`, `preview`, `list` |
| Images | `image upload` |
| Comments | `comment list`, `comment get` |
| Analytics | `analytics totals`, `analytics historical`, `analytics past_day`, `analytics referrers` |
| Search | `search articles`, `search published` |

Every command except `login`, `status`, and `logout` takes `--format tty|markdown|json`. The [devto_cli skill](../../skills/devto_cli/SKILL.md) gives every option.

## The API key

`login` checks the API key with dev.to, then stores the API key in `~/.config/devto_cli/credentials.json`, with the mode `0600`. The environment variable `DEVTO_API_KEY` wins over the credential file. The API key is never stored in a project.

## Use it as a library

[src/index.ts](src/index.ts) is the public interface of the package:

```ts
import { DevtoClient } from 'devto_cli';

const client = new DevtoClient({
	apiKey: process.env.DEVTO_API_KEY ?? '',
});
const drafts = await client.listMyArticles('unpublished', 1, 30);
```

`DevtoClient` takes the API key, the fetch function, and the wait function as options, so that a test gives a fake fetch function. It retries 3 times after an answer 429 (too many requests).

## Develop

| Command | What it does |
|---|---|
| `pnpm test` | Run the tests in [test/](test). The tests never call the real dev.to API. |
| `pnpm typecheck` | Check the types with TypeScript. |
| `pnpm build` | Compile to `dist/`. |

## Folders

Each folder has its own `CONTEXT.md` file, with its exports and its rules.

- [src/api/](src/api/CONTEXT.md): the client of the dev.to API, and the Zod schemas of its answers.
- [src/commands/](src/commands/CONTEXT.md): the commands of the command line.
- [src/config/](src/config/CONTEXT.md): the credential file in the home folder of the user.
- [src/formatters/](src/formatters/CONTEXT.md): the output formats `tty`, `markdown`, and `json`.
- [src/images/](src/images/CONTEXT.md): the upload of the local image files.
- [test/](test): the tests, with the fake fetch function in [test/fake_fetch.ts](test/fake_fetch.ts).
