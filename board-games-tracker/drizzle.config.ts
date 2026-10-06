import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) loadEnvFile(".env.local");

/** Drizzle Kit configuration for PostgreSQL migrations. */
export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/server/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://board_games_tracker:board_games_tracker@localhost:5432/board_games_tracker",
  },
  strict: true,
  verbose: true,
});
