# Changelog

All notable changes to devto_cli are documented in this file.

The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-11-17

### Release notes

The first release of devto_cli lets you manage dev.to articles from a terminal or through a coding agent. Create drafts from Markdown files, upload local cover images and article images automatically, and publish immediately or at a scheduled time when explicitly requested.

Read articles and comments, inspect readership analytics, and search published articles. The included devto_cli skill explains the commands to coding agents, and devto_cli runs directly from GitHub with `npx`.

### Added

- Create and update articles, save drafts by default, schedule publication, set cover images, and list your articles. [Commit](https://github.com/jeromeetienne/devto_cli/commit/87c71abecd117562fdbb57dcb5493ecc9d76efa6)
- Read published articles and your own drafts, and preview Markdown as HTML without saving an article. [Commit](https://github.com/jeromeetienne/devto_cli/commit/a901df7910511c75aa753b20e0114148977b388c)
- Upload images separately or automatically upload local cover images and local Markdown images when creating or updating an article. [Commit](https://github.com/jeromeetienne/devto_cli/commit/a901df7910511c75aa753b20e0114148977b388c)
- Read article comments and replies, view total and historical readership analytics and referring sites, and search articles by words, meaning, tag, or author. [Commit](https://github.com/jeromeetienne/devto_cli/commit/a901df7910511c75aa753b20e0114148977b388c)
- Log in with hidden key entry, or supply the dev.to application programming interface key through `DEVTO_API_KEY`. Check authentication with `status` and remove stored credentials with `logout`. [Login changes](https://github.com/jeromeetienne/devto_cli/commit/88f5f1793d0cd543fc6e503069f939547f68c46c), [status and logout](https://github.com/jeromeetienne/devto_cli/commit/23c3ea759ead9e2db30c6dbc4b7e9decbced3a6b)
- Choose coloured terminal text, Markdown, or JSON output for article, image, comment, analytics, and search commands. [Commit](https://github.com/jeromeetienne/devto_cli/commit/23c3ea759ead9e2db30c6dbc4b7e9decbced3a6b)
- Retry requests up to three times when dev.to reports too many requests, respecting the requested waiting period. [Commit](https://github.com/jeromeetienne/devto_cli/commit/a901df7910511c75aa753b20e0114148977b388c)
- Run devto_cli directly from GitHub with `npx`, and install the devto_cli skill to let a coding agent operate the commands. [Commit](https://github.com/jeromeetienne/devto_cli/commit/8379572fec9204d8c09a60d13eabf56b7004094e)

### Fixed

- Leave Markdown image examples inside inline code and fenced code blocks unchanged instead of uploading the example paths. [Commit](https://github.com/jeromeetienne/devto_cli/commit/3773a3c5e2d4a46172807b17241d1ca87c763262)
- Allow installation and execution from GitHub with `npx` by removing the root build script that prevented installation. [Commit](https://github.com/jeromeetienne/devto_cli/commit/d0f2a9298d9df1980abbcc83c03fdc9b99484177)

[Unreleased]: https://github.com/jeromeetienne/devto_cli/compare/0.1.0...main
[0.1.0]: https://github.com/jeromeetienne/devto_cli/tree/0.1.0
