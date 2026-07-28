import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Applies pending, checksum-tracked migrations before application startup. */
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

// ponytail: retry loop instead of a wait-for-postgres entrypoint script. Docker's
// restart policy ignores depends_on health, so a restarted app can outrace the DB.
// 10 tries x 3s covers normal startup; raise if the DB does slow crash recovery.
for (let attempt = 1; ; attempt++) {
  try {
    await runMigrations();
    break;
  } catch (error) {
    if (attempt >= 10 || !process.env.DATABASE_URL) throw error;
    console.warn(
      `Database not ready (attempt ${attempt}/10): ${error.cause?.message ?? error.message}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
