import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Applies pending, checksum-tracked migrations before application startup.
 *
 * @returns A promise that resolves after all pending migrations are applied.
 */
async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    onnotice: () => undefined,
  });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}

const maxAttempts = 10;
const retryDelayMs = 3_000;

for (let attempt = 1; ; attempt++) {
  try {
    await runMigrations();
    break;
  } catch (error) {
    if (attempt >= maxAttempts || !process.env.DATABASE_URL) throw error;
    console.warn(
      `Database not ready (attempt ${attempt}/${maxAttempts}): ${error.cause?.message ?? error.message}`,
    );
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}
