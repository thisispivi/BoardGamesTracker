import { scrubSentryEvent } from "@/utils/sentryScrub";

/** Execution environments with distinct Sentry integration settings. */
type SentryRuntime = "browser" | "edge" | "server";

/** Error-only Sentry SDK options accepted by every Next.js runtime. */
type SentryOptions = {
  attachStacktrace: boolean;
  beforeSend: typeof scrubSentryEvent;
  dsn: string;
  enableLogs: boolean;
  environment: string;
  initialScope: { tags: { application: string; runtime: SentryRuntime } };
  release?: string;
  sendClientReports: boolean;
  sendDefaultPii: boolean;
  tracesSampleRate: number;
};

/**
 * Builds the error-only Sentry SDK options shared by every Next.js runtime.
 *
 * Bugsink accepts Sentry error envelopes but does not process tracing, replay,
 * profiling, log, or client-outcome payloads. Keeping those signals disabled
 * avoids unnecessary network traffic while retaining stack traces and useful
 * deployment tags on every error.
 *
 * @param dsn - The Sentry-compatible Bugsink project DSN.
 * @param environment - The deployment environment shown in Bugsink.
 * @param release - The immutable release identifier, when configured.
 * @param runtime - The Next.js runtime that captured the error.
 * @returns Privacy-preserving options for Sentry initialization.
 */
export function createSentryOptions(
  dsn: string,
  environment: string,
  release: string | undefined,
  runtime: SentryRuntime,
): SentryOptions {
  return {
    dsn,
    environment,
    ...(release ? { release } : {}),
    attachStacktrace: true,
    enableLogs: false,
    sendClientReports: false,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    initialScope: {
      tags: {
        application: "board-games-tracker",
        runtime,
      },
    },
    beforeSend: scrubSentryEvent,
  };
}
