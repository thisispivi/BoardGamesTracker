import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "@/server/db/schema";

/** Isolated PostgreSQL runtime that never connects to an operator's database. */
export const testDatabase = new PGlite();

/** Executes application queries against the isolated PostgreSQL runtime. */
export const testDb = drizzle(testDatabase, { schema });

/**
 * Applies the checked-in production migrations to a fresh test database.
 *
 * @returns Completion once the schema is ready for application queries.
 */
export async function migrateTestDatabase(): Promise<void> {
  await migrate(testDb, { migrationsFolder: "./drizzle" });
}
