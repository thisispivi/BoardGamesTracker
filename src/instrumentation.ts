import * as Sentry from "@sentry/nextjs";

/**
 * Loads the runtime-appropriate Sentry configuration before the server starts handling requests.
 *
 * @returns The documented function result.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Reports unhandled server-side request errors that Next.js captures internally. */
export const onRequestError = Sentry.captureRequestError;
