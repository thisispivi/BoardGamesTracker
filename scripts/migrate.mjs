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

/**
 * Retries startup migrations while the database finishes accepting connections.
 *
 * Docker's restart policy ignores `depends_on` health checks, so a restarted
 * application can outrace PostgreSQL. Ten attempts three seconds apart covers
 * normal startup; raise it where the database performs slow crash recovery.
 */
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
