import { defineConfig } from "drizzle-kit";

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
