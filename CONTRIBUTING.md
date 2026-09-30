# Contributing

1. Set up the project with the [development steps](./README.md#development).
2. Branch from `main`. Name the branch after the change: `feat/weekly-backups`,
   `fix/admin-search`, `docs/restore-guide`.
3. Make the change, and add or update the test file beside the code it covers.
4. Run the checks from `board-games-tracker/`:

   ```bash
   pnpm check && pnpm test:coverage && pnpm build && pnpm audit --audit-level=moderate
   ```

5. Open a pull request. Say what changes for users, note any database change,
   and add screenshots for interface work.

## Rules

Read [CODING_GUIDELINES.md](./board-games-tracker/CODING_GUIDELINES.md) before
your first change. It covers naming, file layout, typing, validation, security,
and tests.

- Write commit messages as
  [Conventional Commits](https://www.conventionalcommits.org/). CI uses them to
  pick the next version.
- Change the database through `src/server/db/schema.ts` and `pnpm db:generate`.
  Do not edit files in `drizzle/` by hand.
- Do not commit secrets, `.env` files, database dumps, or user data.
- Do not skip the Git hooks with `--no-verify`.

## AI assistants

`AGENTS.md` and `CLAUDE.md` live in `board-games-tracker/` and point to the
coding guidelines. Start your assistant from that folder so it reads them.
