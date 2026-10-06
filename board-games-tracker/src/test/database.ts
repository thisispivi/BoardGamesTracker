import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll } from "vitest";

import * as schema from "@/server/db/schema";

/** Isolated PostgreSQL runtime that never connects to an operator's database. */
const testDatabase = new PGlite();

/** Executes application queries against the isolated PostgreSQL runtime. */
export const testDb = drizzle(testDatabase, { schema });

/**
 * Registers suite hooks that apply the checked-in production migrations before
 * the first test and close the runtime after the last one.
 *
 * @returns Nothing.
 */
export function setupTestDatabase(): void {
  beforeAll(async () => {
    await migrate(testDb, { migrationsFolder: "./drizzle" });
  }, 30_000);
  afterAll(async () => {
    await testDatabase.close();
  });
}
