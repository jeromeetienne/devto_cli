# AGENTS.md

## The Rules of the Repo

Before every change of this repository, follow the skill [rules_of_the_repo](.agents/skills/rules_of_the_repo/SKILL.md): read the rules list, and obey each rule skill that applies to the change, with its configuration.

- Rules list: .agents/rules_of_the_repo/rules_list.md

## Issue Fix Workflow

Every issue fix in this repository follows the skill [issue_fix_workflow](.agents/skills/issue_fix_workflow/SKILL.md). Read the skill before you start an issue fix, each time that the developer asks to fix an issue.
The skill names no detail of this repository: it reads the values of this repository in the section "Issue Fix Workflow values" below.

### Issue Fix Workflow values

- Target branch: `main`
- Worktree creation command: `git fetch origin main && git worktree add -b <branch> .agents/worktree/<branch> origin/main`, run from the root of the repository
- Worktree folder: `.agents/worktree/<branch>`
- Launch command: `pnpm install && pnpm --filter devto_cli dev -- --help`
- Issue tracker commands:
  - Read an issue: `gh issue view <number> --comments`
  - Comment on an issue: `gh issue comment <number> --body-file <file>`
  - Create an issue: `gh issue create`
  - Create a pull request: `gh pr create --base main`
  - Merge a pull request: `gh pr merge <number> --merge --delete-branch`
  - Close an issue: `gh issue close <number>`
- Chat rename: not available

## Issue Batch Workflow

A batch of related issues (one parent issue with two or more sub-issues) follows the skill [issue_batch_workflow](.agents/skills/issue_batch_workflow/SKILL.md), in place of the Issue Fix Workflow. Read the skill before you start, each time that the developer asks to fix such a batch. The skill uses the section "Issue Fix Workflow values" above.
