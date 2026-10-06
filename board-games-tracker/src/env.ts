import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import {
  appOriginSchema,
  booleanStringSchema,
  databaseUrlSchema,
  httpEndpointSchema,
} from "@/core";

/** Validated application environment. */
export const env = createEnv({
  server: {
    ADMIN_EMAIL: z.email().optional(),
    ALLOW_SIGN_UP: booleanStringSchema.default(false),
    BETTER_AUTH_SECRET: z.string().min(32).max(4_096),
    BETTER_AUTH_URL: appOriginSchema,
    DATABASE_URL: databaseUrlSchema,
    HEALTH_CHECK_TOKEN: z.string().min(16).optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SEARXNG_URL: httpEndpointSchema,
    SENTRY_DSN: z.url().optional(),
    SMTP_FROM_EMAIL: z.email().optional(),
    SMTP_FROM_NAME: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .default("Board Games Tracker"),
    SMTP_HOST: z.string().trim().min(1).max(253).optional(),
    SMTP_PASSWORD: z.string().min(1).max(1_000).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
    SMTP_REPLY_TO: z.email().optional(),
    SMTP_REQUIRE_TLS: booleanStringSchema.default(true),
    SMTP_SECURE: booleanStringSchema.default(false),
    SMTP_USER: z.string().min(1).max(500).optional(),
    TRUSTED_PROXIES: z.string().trim().max(2_000).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: appOriginSchema,
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
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    SEARXNG_URL: process.env.SEARXNG_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,
    SMTP_REQUIRE_TLS: process.env.SMTP_REQUIRE_TLS,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    TRUSTED_PROXIES: process.env.TRUSTED_PROXIES,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
