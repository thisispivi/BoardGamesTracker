import "server-only";

import { env } from "@/env";

/** Supported severity levels for structured application events. */
type LogLevel = "debug" | "info" | "warn" | "error";

/** Scalar metadata safe to serialize alongside a structured event. */
type LogContext = Record<string, boolean | number | string | null | undefined>;

const priorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const blockedKeys = new Set([
  "password",
  "secret",
  "token",
  "cookie",
  "authorization",
]);

/**
 * Writes structured, redacted application logs to standard output.
 *
 * @param level - Severity used for the structured log entry.
 * @param message - Stable event name recorded by the logger.
 * @param context - Scalar fields to record; secret-looking keys are dropped.
 * @returns Nothing.
 */
export function log(
  level: LogLevel,
  message: string,
  context: LogContext = {},
): void {
  if (priorities[level] < priorities[env.LOG_LEVEL]) {
    return;
  }

  const safeContext = Object.fromEntries(
    Object.entries(context).filter(
      ([key]) => !blockedKeys.has(key.toLowerCase()),
    ),
  );
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...safeContext,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.log(entry);
}
