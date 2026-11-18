import { captureMessage, flush, init, type NodeOptions } from "@sentry/node";

/** Factory the Sentry SDK calls to build its transport. */
type TransportFactory = NonNullable<NodeOptions["transport"]>;

/** Transport built from the configured DSN. */
type Transport = ReturnType<TransportFactory>;

/** Envelope tuple the SDK hands to a transport. */
type Envelope = Parameters<Transport["send"]>[0];

/** What the verified transport observed while sending the test event. */
type IngestionResult = {
  failure?: unknown;
  response?: Response;
};

/**
 * Serializes the error envelope produced by the SDK for Bugsink ingestion.
 *
 * @param envelope - The Sentry envelope tuple to serialize.
 * @returns The newline-delimited envelope body.
 */
function serializeEnvelope(envelope: Envelope): string {
  const [headers, items] = envelope;
  return [
    JSON.stringify(headers),
    ...items.flatMap(([itemHeaders, payload]) => [
      JSON.stringify(itemHeaders),
      typeof payload === "string" ? payload : JSON.stringify(payload),
    ]),
  ].join("\n");
}

/**
 * Creates a transport factory that records Bugsink's HTTP acknowledgement.
 *
 * @param result - Mutable record the transport fills with the response or the
 * network failure, read after the SDK flushes.
 * @returns A Sentry-compatible transport factory using a bounded fetch.
 */
function createVerifiedTransport(result: IngestionResult): TransportFactory {
  return (options) => {
    let pendingRequest: ReturnType<Transport["send"]> = Promise.resolve({});

    return {
      send(envelope) {
        pendingRequest = fetch(options.url, {
          method: "POST",
          signal: AbortSignal.timeout(10_000),
          headers: {
            "Content-Type": "application/x-sentry-envelope",
            ...options.headers,
          },
          body: serializeEnvelope(envelope),
        })
          .then((response) => {
            result.response = response;
            return {
              statusCode: response.status,
              headers: {
                "retry-after": response.headers.get("retry-after"),
                "x-sentry-rate-limits": response.headers.get(
                  "x-sentry-rate-limits",
                ),
              },
            };
          })
          .catch((error: unknown) => {
            result.failure = error;
            throw error;
          });
        return pendingRequest;
      },
      async flush() {
        await pendingRequest;
        return true;
      },
    };
  };
}

/**
 * Sends one tagged test event to the configured DSN and verifies acceptance.
 *
 * @returns A promise that resolves once Bugsink acknowledged the event.
 */
async function testBugsink(): Promise<void> {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    throw new Error(
      "Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN before testing Bugsink.",
    );
  }

  const result: IngestionResult = {};
  const release =
    process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.SENTRY_RELEASE;
  init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.SENTRY_ENVIRONMENT ??
      "development",
    ...(release ? { release } : {}),
    attachStacktrace: false,
    sendClientReports: false,
    dataCollection: { stackFrameVariables: false, userInfo: false },
    tracesSampleRate: 0,
    transport: createVerifiedTransport(result),
    initialScope: {
      tags: {
        application: "board-games-tracker",
        integration_test: "true",
        runtime: "server",
      },
    },
  });

  const eventId = captureMessage(
    "Board Games Tracker Bugsink integration check",
    "info",
  );
  if (!(await flush(10_000))) {
    throw new Error(
      `The SDK could not flush Bugsink test event ${eventId} in time.`,
    );
  }
  if (result.failure !== undefined) {
    throw new Error(`Bugsink ingestion failed: ${String(result.failure)}`);
  }
  if (!result.response?.ok) {
    throw new Error(
      `Bugsink rejected test event ${eventId} with HTTP ${result.response?.status ?? "no response"}.`,
    );
  }
  process.stdout.write(`Bugsink accepted test event ${eventId}.\n`);
}

void testBugsink().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Bugsink test failed.",
  );
  process.exitCode = 1;
});
