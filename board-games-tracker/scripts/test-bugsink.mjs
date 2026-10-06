import { captureMessage, flush, init } from "@sentry/node";

let ingestionResponse;
let transportFailure;

/**
 * Serializes the error envelope produced by the SDK for Bugsink ingestion.
 *
 * @param envelope - The Sentry envelope tuple to serialize.
 * @returns The newline-delimited envelope body.
 */
function serializeEnvelope(envelope) {
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
 * Creates a transport that exposes Bugsink's HTTP acknowledgement to the smoke test.
 *
 * @param options - The transport options generated from the configured DSN.
 * @returns A Sentry-compatible transport with a verified fetch request.
 */
function createVerifiedTransport(options) {
  let pendingRequest = Promise.resolve();

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
          ingestionResponse = response;
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
        .catch((error) => {
          transportFailure = error;
          throw error;
        });
      return pendingRequest;
    },
    async flush() {
      await pendingRequest;
      return true;
    },
  };
}

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) {
  throw new Error(
    "Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN before testing Bugsink.",
  );
}

const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.SENTRY_ENVIRONMENT ??
  "development";
const release =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.SENTRY_RELEASE;

init({
  dsn,
  environment,
  release,
  attachStacktrace: false,
  enableLogs: false,
  sendClientReports: false,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  transport: createVerifiedTransport,
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
const flushed = await flush(10_000);

if (!flushed) {
  throw new Error(
    `The SDK could not flush Bugsink test event ${eventId} in time.`,
  );
}

if (transportFailure) {
  throw new Error(`Bugsink ingestion failed: ${String(transportFailure)}`);
}

if (!ingestionResponse?.ok) {
  throw new Error(
    `Bugsink rejected test event ${eventId} with HTTP ${ingestionResponse?.status ?? "no response"}.`,
  );
}

process.stdout.write(`Bugsink accepted test event ${eventId}.\n`);
