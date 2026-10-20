---
name: database
description: Changes the database schema or writes Drizzle queries, transactions and upserts. Use whenever src/server/db/schema.ts, the drizzle/ folder, or a query under src/server/ changes.
---

# Database

Paths are relative to `board-games-tracker/`. The rules in
`CODING_GUIDELINES.md` §8 and §10.7 apply; this skill adds the steps and the
patterns the codebase already uses.

## Changing the schema

1. Edit `src/server/db/schema.ts` only. Never write or edit a file in
   `drizzle/` by hand, including `drizzle/meta/`.
2. Generate the migration with `pnpm db:generate`. Review the new
   `drizzle/NNNN_*.sql` and its snapshot; if it is wrong, revert both, fix
   `schema.ts` and generate again. "No schema changes" means nothing to commit.
3. Update every reader and writer: queries under `src/server/`, the actions in
   `src/server/actions/`, the import and export formats in
   `src/server/userData/` when the field belongs to a user's library, and the
   demo data under `src/core/demo/` if the demo shows it.
4. Apply locally with `pnpm db:migrate`. Production applies migrations when the
   container starts (`scripts/migrate.mjs`, called by the `Dockerfile` `CMD`).
   `src/server/db/schema.test.ts` covers constraints.
5. Say in the pull request that the database changes.

## Writing queries

- The client is `db` from `@/server/db`, a `postgres-js` pool with
  `prepare: false`. Import tables from `@/server/db/schema`.
- Rows from several accounts that must agree: inside `db.transaction`, select
  them with `.orderBy(asc(user.id)).for("update")`, recheck authorization on
  the locked rows, then write (`src/server/actions/admin.ts`). Locking in id
  order stops two transactions from deadlocking.
- Shared catalog rows are inserted idempotently with
  `.onConflictDoNothing({ target: games.bggId })` and
  `.onConflictDoNothing({ target: gameImages.checksum })`
  (`src/server/actions/collection.ts`).
- Every list query has a `limit`; the paged library queries live in
  `src/server/collection.ts`.

Then run the `check` skill.
