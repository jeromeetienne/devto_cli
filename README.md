# Let Your Agent Drive dev.to

**devto_cli** is a command line for [dev.to](https://dev.to), made for your coding agent. Give your coding agent the devto_cli skill, then ask in plain words: "put my article on dev.to as a draft, with its cover and its images". The coding agent runs the commands, and never publishes without asking you.

Because copy and paste of the same API key one hundred times a day is not a hobby. 🦄

## Start in 3 steps

1. Add the devto_cli skill to your coding agent, with [skills.sh](https://skills.sh/docs):

   ```bash
   npx skills add jeromeetienne/devto_cli --skill devto_cli
   ```

2. Log in one time. Create the API key in the dev.to settings, in the section "Extensions". Type this command yourself, so that the API key never goes through the chat:

   ```bash
   npx --yes github:jeromeetienne/devto_cli login
   ```

3. Ask your coding agent:

   > Put my article `docs/my_article.md` on dev.to as a draft, with its cover and its images. Give me the address of the draft.

## What your coding agent can do

- **Articles**: create a draft, update it, publish it now or at a future date, change it back into a draft, read it, preview it, and list your articles.
- **Images**: the local cover image and the local images of the text are uploaded automatically.
- **Comments**: read the comments of an article, with the answers.
- **Analytics**: the totals, each day, the past day, and the sites that send you readers.
- **Search**: by words, by meaning, by tag, or by author.

Every command takes `--format tty|markdown|json`. A command never publishes an article unless it gets an explicit option to publish.

## Run the commands yourself

```bash
npx --yes github:jeromeetienne/devto_cli create --title "My title" --body-file ./article.md --cover-image ./cover.png
npx --yes github:jeromeetienne/devto_cli list --filter unpublished
npx --yes github:jeromeetienne/devto_cli status
```

Every command and every option is in [skills/devto_cli/SKILL.md](skills/devto_cli/SKILL.md).

## What dev.to does not allow with an API key

Reactions, the search of the users, posting a comment, and deleting an article. To delete a draft, use the dev.to website.

## Develop

```bash
pnpm install
pnpm test
```

The code is in [packages/devto_cli](packages/devto_cli), and its tests are in [packages/devto_cli/test](packages/devto_cli/test).

## Read more

The blog post [Let Your Agent Drive dev.to](docs/blog_posts/01_from_markdown_to_a_devto_draft_with_devto_cli/ARTICLE.md) tells why a coding agent works better with devto_cli than with the dev.to API directly.
