# Directory Context: `/packages/devto_cli/src/config`

## Purpose
Read and write the credential file that holds the dev.to API key, in `~/.config/devto_cli/credentials.json`.

## Key Exports & Entry Points
- `credential_store.ts`: `CredentialStore`, with `save`, `load`, and `filePath`.
- `credential_types.ts`: `CredentialSchema` and `Credential`.

## Rules
- Nothing here imports from `../api` or from `../commands`.
- The credential file has the mode `0600`, and its folder has the mode `0700`.
- The constructor takes the folder, so that a test uses a temporary folder and never the home folder.

## Background
- The API key is stored at the user level, never in the project: https://github.com/jeromeetienne/devto_cli/issues/1.
