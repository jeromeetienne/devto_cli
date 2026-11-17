# devto_cli

A command-line client for [dev.to](https://dev.to), because copy and paste of the same API key one hundred times a day is not a hobby.

Status: it works. 🦄 Log in one time, then create, update, schedule, and preview articles, upload images, read comments and analytics, and search dev.to.

Add the devto_cli skill to your coding agent, then ask your coding agent in plain words:

```bash
npx skills add jeromeetienne/devto_cli --skill devto_cli
```

Or run the commands yourself, from any folder, with no build and no npm registry:

```bash
npx --yes github:jeromeetienne/devto_cli login
npx --yes github:jeromeetienne/devto_cli create --title "My title" --body-file ./article.md --cover-image ./cover.png
```

Every command is in [skills/devto_cli/SKILL.md](skills/devto_cli/SKILL.md).
