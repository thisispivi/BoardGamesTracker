import type { NodeOptions } from "@sentry/nextjs";

import { scrubSentryEvent } from "@/utils/sentryScrub";

/**
 * Framework messages that report a disconnected client rather than a defect.
 *
 * Next.js aborts the React stream when a visitor navigates away from, or
 * cancels a prefetch of, a page that is still rendering. Nothing in the
 * application can act on it, so reporting it only hides real failures.
 */
const ignoredMessages = ["The destination stream closed early."];

/** What the SDK may attach to an event, typed by the installed Sentry version. */
type DataCollection = NonNullable<NodeOptions["dataCollection"]>;

/**
 * Turns off every category of request, user and runtime data the SDK collects.
 *
 * Sentry 11 replaced `sendDefaultPii` with these per-category switches, most of
 * which default to on. `scrubSentryEvent` still strips the event as a second
 * line of defence.
 */
const collectNothing: DataCollection = {
  cookies: false,
  databaseQueryData: false,
  genAI: { inputs: false, outputs: false },
  graphQL: { document: false, variables: false },
  httpBodies: [],
  httpHeaders: false,
  queues: false,
  stackFrameVariables: false,
  urlQueryParams: false,
  userInfo: false,
};

/** Execution environments with distinct Sentry integration settings. */
type SentryRuntime = "browser" | "edge" | "server";

/** Error-only Sentry SDK options accepted by every Next.js runtime. */
type SentryOptions = {
  attachStacktrace: boolean;
  beforeSend: typeof scrubSentryEvent;
  dataCollection: DataCollection;
  dsn: string;
  ignoreErrors: string[];
  environment: string;
  initialScope: { tags: { application: string; runtime: SentryRuntime } };
  release?: string;
  sendClientReports: boolean;
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
    dataCollection: collectNothing,
    ignoreErrors: ignoredMessages,
    sendClientReports: false,
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
