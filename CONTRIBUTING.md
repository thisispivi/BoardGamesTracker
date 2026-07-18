# Contributing

Thank you for improving Board Games Tracker.

1. Create a focused branch from `main`.
2. Install with `pnpm install --frozen-lockfile` and copy `.env.example` to `.env.local`.
3. Add or update tests for behavior changes.
4. Run `pnpm check` and `pnpm build`.
5. Describe user impact, schema changes, screenshots, and security considerations in the pull request.

Use strict TypeScript, validate data at trust boundaries with Zod, and keep database authorization in the same query as the mutation. Add a concise JSDoc summary to exported functions and components. Do not put implementation comments at the end of code lines.

Schema changes require a generated and reviewed migration. Never commit secrets, local environment files, database dumps, or user data.
