import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Validated application environment. */
export const env = createEnv({
  server: {
    ADMIN_EMAIL: z.email().optional(),
    ALLOW_SIGN_UP: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.url(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SEARXNG_URL: z.url(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ALLOW_SIGN_UP: process.env.ALLOW_SIGN_UP,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SEARXNG_URL: process.env.SEARXNG_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
