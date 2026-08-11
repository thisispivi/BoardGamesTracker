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
    HEALTH_CHECK_TOKEN: z.string().min(16).optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SEARXNG_URL: z.url(),
    SENTRY_DSN: z.url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[^\s/]+$/)
      .default(process.env.NODE_ENV ?? "development"),
    NEXT_PUBLIC_SENTRY_RELEASE: z.string().trim().min(1).max(200).optional(),
  },
  runtimeEnv: {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ALLOW_SIGN_UP: process.env.ALLOW_SIGN_UP,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    HEALTH_CHECK_TOKEN: process.env.HEALTH_CHECK_TOKEN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    SEARXNG_URL: process.env.SEARXNG_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
