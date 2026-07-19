# Contributing

Thank you for improving Board Games Tracker.

1. Create a focused branch from `main`.
2. Install with `pnpm install --frozen-lockfile` and copy `.env.example` to `.env.local`.
3. Add or update tests under `src/core/tests/`, mirroring the source area they cover.
4. Run `pnpm check` and `pnpm build`.
5. Describe user impact, schema changes, screenshots, and security considerations in the pull request.

Use strict TypeScript, keep shared typings and Zod contracts in `src/core/`, validate data at trust boundaries, and keep database authorization in the same query as the mutation. Components follow the Atomic Design folders under `src/components/` and use direct component-file imports. Add a concise JSDoc summary to exported functions and components. Do not put implementation comments at the end of code lines.

Schema changes require a generated and reviewed migration. Never commit secrets, local environment files, database dumps, or user data.
