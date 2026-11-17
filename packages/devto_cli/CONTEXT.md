# Directory Context: `/packages/devto_cli`

## Purpose
The command line `devto_cli`, a client of the dev.to API with a login that stores the API key in the home folder of the user.

## Key Exports & Entry Points
- `src/index.ts`: the public interface of the package (`DevtoClient`, `CredentialStore`, `ProgramFactory`, `ImageUploader`, `MarkdownImages`, the types and the Zod schemas).
- `src/cli.ts`: the entry point of the command line; it is `dist/cli.js` after the build.
- `src/api/`: the client of the dev.to API — see its own CONTEXT.md.
- `src/config/`: the credential file in the home folder of the user — see its own CONTEXT.md.
- `src/commands/`: the commands of the command line — see its own CONTEXT.md.
- `src/formatters/`: the output formats `json`, `markdown`, and `tty` — see its own CONTEXT.md.
- `src/images/`: the upload of the local image files — see its own CONTEXT.md.
- `test/`: the tests, run with `pnpm test`; they never call the real dev.to API.
- Command to run this folder: `pnpm dev -- <command>`, or `npx devto_cli <command>` after `pnpm build` and `pnpm install`.

## Rules
- Only `src/index.ts` and `src/cli.ts` sit in `src/`; every other source file is in a subfolder of `src/`.
- The API key is never written in the project, only in the credential file of `src/config/`.
- A test never sends a request to the real dev.to API: it gives a fake fetch function (`test/fake_fetch.ts`) to `DevtoClient`.

## Background
- The layout and the first commands come from https://github.com/jeromeetienne/devto_cli/issues/2.
