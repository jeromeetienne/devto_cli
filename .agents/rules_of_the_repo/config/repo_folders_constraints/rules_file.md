# Repo Folders Constraints

## Packages

| Folder | Does | Never does | May import | Language and technologies | Workflow |
|---|---|---|---|---|---|
| `packages/devto_cli` | the command-line client of the dev.to API, with the `login` command | stores the API key in the project | no other package | TypeScript, tsx, Commander.js, Zod | the Issue Fix Workflow |

## Other folders

| Folder | Does | Never does | Language and technologies | Workflow |
|---|---|---|---|---|
| `skills/devto_cli` | the `SKILL.md` file that lets a coding agent use `devto_cli` | holds code | Markdown | the Issue Fix Workflow |
| `.agents/skills` | the installed skills | gets a change in this repository | Markdown | install the skills again from `coding_agent_plugins` |
| `.claude/skills` | the symbolic links to `.agents/skills` | holds a file that is not a symbolic link | — | install the skills again from `coding_agent_plugins` |
| `.agents/rules_of_the_repo` | the rules list and the configuration files of the rule skills | gets a change without the approval of the human | Markdown | the skill `rules_of_the_repo` |
| `.agents/worktree` | the temporary worktrees of the Issue Fix Workflow | gets tracked by Git | — | the value "Worktree creation command" in `AGENTS.md` |
| `docs` | the documentation | — | Markdown | the skill `docs_folder_system` |
