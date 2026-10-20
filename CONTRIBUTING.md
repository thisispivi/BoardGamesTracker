# Contributing

1. Set up the project with the [development steps](./README.md#development).
2. Branch from `main`. Name the branch after the change: `feat/weekly-backups`,
   `fix/admin-search`, `docs/restore-guide`.
3. Make the change, and add or update the test file beside the code it covers.
4. Run the gate at the top of
   [CODING_GUIDELINES.md](./board-games-tracker/CODING_GUIDELINES.md) from
   `board-games-tracker/`. The `check` skill in `.claude/skills/` explains how
   to fix each failure.

5. Open a pull request. Say what changes for users, note any database change,
   and add screenshots for interface work.

## Rules

Read [CODING_GUIDELINES.md](./board-games-tracker/CODING_GUIDELINES.md) before
your first change. It covers naming, file layout, typing, validation, security,
and tests.

- Write commit messages as
  [Conventional Commits](https://www.conventionalcommits.org/). CI uses them to
  suggest the next version. Include a package version bump in a release PR;
  CI publishes the merged version without pushing directly to protected `main`.
- Change the database through `src/server/db/schema.ts` and `pnpm db:generate`.
  Do not edit files in `drizzle/` by hand.
- Do not commit secrets, `.env` files, database dumps, or user data.
- Do not skip the Git hooks with `--no-verify`.

## AI assistants

`AGENTS.md` and `CLAUDE.md` live in `board-games-tracker/` and point to the
coding guidelines. For Claude Code, start at the repository root: the root
`CLAUDE.md` imports them, and `.claude/` holds the shared plugins and the
project skills (`check`, `nextjs`, `react-best-practices`, `drizzle-queries`,
`db-schema-change`, `server-action`, `api-route`, `env-setting`,
`ui-component`). Third-party plugins are pinned to a commit
`sha` in `.claude/settings.json`; review the upstream diff before you raise
it. Keep personal plugins in `.claude/settings.local.json`, which Git ignores. Other assistants can start in
`board-games-tracker/`.
