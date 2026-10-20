---
name: db-schema-change
description: Adds or changes a database table, column, constraint or index and generates its migration. Use whenever src/server/db/schema.ts or the drizzle/ folder would change.
---

# Database schema change

Paths are relative to `board-games-tracker/`.

## Steps

1. Edit `src/server/db/schema.ts` only. Never write or edit a file in
   `drizzle/` by hand, including `drizzle/meta/`.
2. Put invariants in the database too: `check`, `unique` and foreign keys, so a
   code bug cannot corrupt state.
3. Generate the migration:

   ```bash
   pnpm db:generate
   ```

   Review the new `drizzle/NNNN_*.sql` and its snapshot. If it is wrong, revert
   both, fix `schema.ts` and generate again.

4. If the column holds data shared across layers, add or extend the Zod schema
   in `src/core/<domain>/<domain>.contract.ts`, export the `z.infer` type beside
   it and re-export from `src/core/index.ts`. Reuse the bounds in
   `src/core/shared/shared.contract.ts` (title, year, price, artwork URL,
   `emptyAsNull`, `refineGameRanges`) before writing new ones.
5. Update every reader and writer: queries under `src/server/`, the actions in
   `src/server/actions/`, the import and export formats in
   `src/server/userData/` when the field belongs to a user's library, and the
   demo data under `src/core/demo/` if the demo shows it.
6. Test against real migrations. Persistence tests mock the database with the
   PGlite instance:

   ```ts
   vi.mock("server-only", () => ({}));
   vi.mock("@/server/db", async () => ({
     db: (await import("@/test/database")).testDb,
   }));
   ```

   then call `setupTestDatabase()` and reset rows in `beforeEach`.
   `src/server/db/schema.test.ts` covers constraints.

7. Apply locally with `pnpm db:migrate`. Production applies migrations at
   container start (`scripts/migrate.mjs`, called by the `Dockerfile` `CMD`).
8. Run the `check` skill.

## Hard rules

- Drizzle only. Raw SQL only through the `sql` template, never with
  interpolated user input.
- Mutations scope ownership in the same query:
  `where(and(eq(table.id, id), eq(table.userId, session.user.id)))`.
- Say in the pull request that the database changes.
