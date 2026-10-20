---
name: drizzle-queries
description: Writes or reviews Drizzle ORM queries, transactions and upserts against PostgreSQL. Use for any select, insert, update, delete or transaction under src/server/; use db-schema-change instead when the schema itself changes.
---

# Drizzle queries

Paths are relative to `board-games-tracker/`. For Drizzle API details, ask the
Context7 plugin for the `drizzle-orm` docs. The installed version is in
`package.json`.

## Where things are

- Client: `db` from `@/server/db` (`src/server/db/index.ts`), a `postgres-js`
  pool with `prepare: false`.
- Tables and relations: `src/server/db/schema.ts`. Import tables from
  `@/server/db/schema`.
- Operators come from `drizzle-orm`: `and`, `eq`, `inArray`, `asc`, `or`,
  `sql`.

## Patterns this codebase uses

- **Ownership in the same query.** Every update or delete scopes to the
  caller:

  ```ts
  await db
    .update(collectionItems)
    .set(changes)
    .where(
      and(
        eq(collectionItems.id, id),
        eq(collectionItems.userId, session.user.id),
      ),
    );
  ```

  Never load a row, check `userId` in code, then write.

- **Several accounts or rows that must agree: lock, then recheck.** See
  `src/server/actions/admin.ts`: inside `db.transaction`, select the rows
  with `.orderBy(asc(user.id)).for("update")`, recheck authorization on the
  locked rows, then write. Order the lock by id so two transactions cannot
  deadlock.
- **Idempotent inserts.** Shared catalog rows use
  `.onConflictDoNothing({ target: games.bggId })` and
  `.onConflictDoNothing({ target: gameImages.checksum })`
  (`src/server/actions/collection.ts`).
- **Raw SQL** only through the `sql` template for what Drizzle cannot
  express. Values go in as template parameters, never by string
  concatenation.
- **Bounded reads.** Every list query has a `limit`. Paged library queries
  live in `src/server/collection.ts`.

## Testing

Mock `@/server/db` with the PGlite `testDb` from `@/test/database` and call
`setupTestDatabase()`. It applies the real migrations, so constraints, locks
and conflicts behave as in production. See
`src/server/actions/preferences.test.ts`. Never use `DATABASE_URL` in tests.

Then run the `check` skill.
