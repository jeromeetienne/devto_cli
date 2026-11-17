# devto_cli

A command-line client for [dev.to](https://dev.to), because copy and paste of the same API key one hundred times a day is not a hobby.

Status: it works. 🦄 Log in one time, then create, update, schedule, and preview articles, upload images, read comments and analytics, and search dev.to.

```bash
pnpm install && pnpm build && pnpm install
printf '%s' "$DEVTO_API_KEY" | npx devto_cli login
npx devto_cli create --title "My title" --body-file ./article.md --cover-image ./cover.png
```

Every command is in [skills/devto_cli/SKILL.md](skills/devto_cli/SKILL.md).
