# Let Your Agent Drive dev.to

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Article draft for review; uploaded to dev.to as a draft, not published
- Related framing: [Project instructions](../../../AGENTS.md)
- Related rules: [Documentation rules](../../../.agents/skills/docs_folder_system/SKILL.md)
- Related issue: [Technical article workflow, issue #3](https://github.com/jeromeetienne/devto_cli/issues/3)

*You already write with a coding agent. Give the coding agent one skill, and the coding agent puts your article on dev.to as a draft, with its cover and its images, and never publishes without asking you.*

![A local Markdown article passes through devto_cli into an unpublished dev.to draft.](image-main-v1.png)

## A command line that you never type

[devto_cli](https://github.com/jeromeetienne/devto_cli) is a command line for dev.to. It creates and updates articles, uploads images, reads comments, shows analytics, and searches dev.to.

Here is the surprise: devto_cli is not really made for you to type. It is made for your coding agent. The repository ships the [devto_cli skill](https://github.com/jeromeetienne/devto_cli/blob/main/skills/devto_cli/SKILL.md), a short file of instructions that tells a coding agent which command does what, which options exist, and which actions need your permission first.

So the real interface is a sentence in plain English:

> Put the article in `docs/blog_posts/01_my_feature/ARTICLE.md` on dev.to as a draft, with the cover `image-main-v1.png` and the tags `typescript` and `cli`.

The coding agent reads the devto_cli skill, runs the command, and gives you back the address of the draft. You open the draft on dev.to and read it. That is the whole workflow.

## What you can ask

Everything below is a request in plain words. The coding agent picks the command.

- **Create a draft** from a Markdown file, with a title, tags, a description, a series, a canonical address, and a cover image.
- **Keep your images local.** Write `![diagram](./diagram.png)` in your Markdown file. devto_cli uploads each local image to dev.to and replaces the local path with the hosted address. The cover image works the same way.
- **Update the same draft** after each revision, so you get one draft, not five.
- **Publish now, or at a date**, for example "publish it next Tuesday at 9:00 in Paris". The devto_cli skill tells the coding agent to ask you before it publishes or schedules anything.
- **Turn a published article back into a draft.**
- **Read an article back** with its text, to compare the remote draft with your local file.
- **Preview** the rendered page of an article before anything is saved on dev.to.
- **List** your drafts, your published articles, or both.
- **Read the comments** of an article, with the answers.
- **See the analytics**: totals, views by day, the last day, and the sites that send you readers, for all your articles or for one article.
- **Search dev.to** by words, or by meaning, for example "what did people write about faster Rust builds this month?" before you write your own article.

## Why not let the coding agent call the dev.to application programming interface directly?

A good coding agent can read the dev.to application programming interface documentation and write the requests by itself. It works. It also goes wrong in small, boring, expensive ways, every session, again. devto_cli fixes each of those ways one time.

**Your application programming interface key stays out of the chat.** Without devto_cli, the application programming interface key goes into each request that the coding agent writes, and each request goes into the chat transcript and the shell history. With devto_cli, you log in one time. The command checks the application programming interface key with dev.to, stores the application programming interface key in your home folder, and every later command reads the application programming interface key from there. The coding agent never needs to see the application programming interface key again.

**Local images just work.** The dev.to application programming interface accepts only hosted image addresses. Your article has local files. Without devto_cli, the coding agent must find each image, upload each image, collect each address, rewrite the Markdown, and not forget the cover. With devto_cli, the coding agent passes the Markdown file, and devto_cli does the rest.

**Safe by default.** `create` always makes a draft, unless the coding agent adds an explicit option to publish. `update` keeps the publication state as it is, so a small fix to a published article does not hide the article by accident. And the devto_cli skill says it in one plain rule: ask the developer before you publish.

**The traps are already found.** Some parts of the dev.to application programming interface do not do what their documentation suggests. The "unpublish" operation refuses an author's application programming interface key, so devto_cli turns an article back into a draft another way. dev.to limits how many images you can upload in a short time, so devto_cli waits and tries again. Reactions, user search, posting a comment, and deleting an article are not possible with an application programming interface key at all, and the devto_cli skill says so. A coding agent that reads the devto_cli skill does not spend twenty minutes finding this out again.

A real example, from the day this article was written: I asked my coding agent to delete a test draft with devto_cli. The coding agent answered in a few seconds that the dev.to application programming interface has no operation to delete an article, and that the only way is the "Delete" button on the dev.to website. No trial and error, no strange error message to decode. The answer was already in the devto_cli skill.

**Short commands, clean answers.** One command line is easier to read, to repeat, and to check than a block of hand-written requests. With `--format json`, devto_cli gives the coding agent all the fields that dev.to sends, so the coding agent reads the article identifier directly and uses it in the next update.

## Add the devto_cli skill

In the project where you write your articles, add the devto_cli skill with [skills.sh](https://skills.sh/docs), and select your coding agent when asked:

```bash
npx skills add jeromeetienne/devto_cli --skill devto_cli
```

Then log in one time with your dev.to application programming interface key. You can create the application programming interface key in the dev.to settings, in the "Extensions" section. Type this command yourself, so that the application programming interface key never goes through the chat. Paste the application programming interface key when the command asks for it: the command does not show it.

```bash
npx --yes github:jeromeetienne/devto_cli login
```

Now ask your coding agent:

> Put my article on dev.to as a draft, with its cover and its images. Give me the address of the draft.

And after your next revision:

> Update the same dev.to draft from the new version of the article. Keep the article as a draft.

When the article is ready, and only then:

> Publish the article on dev.to.

Writing the article is your job. Driving dev.to is now the job of the coding agent.
