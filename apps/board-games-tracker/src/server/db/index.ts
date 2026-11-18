import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "@/server/db/schema";

/**
 * Development-only slot on `globalThis` that keeps one connection pool across
 * hot reloads. The cast is safe because the slot is optional and only this
 * module writes it; it can go when Next.js stops re-evaluating server modules
 * on reload.
 */
const globalDatabase = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
};

const sqlClient =
  globalDatabase.sqlClient ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => undefined,
  });

if (env.NODE_ENV !== "production") {
  globalDatabase.sqlClient = sqlClient;
}

/** Typed Drizzle database client. */
export const db = drizzle(sqlClient, { schema });
