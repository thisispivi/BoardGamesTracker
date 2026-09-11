# Contributing

Thank you for improving Board Games Tracker.

1. Create a focused branch from `main`, named `kind/short-name` after its Conventional Commit type: `feat/weekly-backups`, `fix/admin-search`, `docs/restore-guide`.
2. Work inside `board-games-tracker/`, where the application lives. Install with `pnpm install --frozen-lockfile` and copy `.env.example` to `.env.local`.
3. Add or update `fileName.test.ts(x)` beside the source file it covers.
4. From `board-games-tracker/`, run `pnpm check`, `pnpm test:coverage`,
   `pnpm build`, and `pnpm audit --audit-level=moderate`. `pnpm install` sets up
   the Git hooks: committing formats and lints staged files, and pushing runs
   `pnpm check`. Never bypass them with `--no-verify`.
5. Describe user impact, schema changes, screenshots, and security considerations in the pull request.

Read [`CODING_GUIDELINES.md`](board-games-tracker/CODING_GUIDELINES.md) before your first change. It is the authoritative style guide and covers naming, file layout, mandatory JSDoc, typing rules, i18n, data contracts, security boundaries, and tests. The same file is wired into the Claude, Codex, and GitHub Copilot configurations, so assistants working in this repository follow it too.

Schema changes require a generated and reviewed migration. Never commit secrets, local environment files, database dumps, or user data.
