import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Strips user identity, cookies, request bodies, and headers from an outgoing error event.
 *
 * Fixing an error only requires the exception, stack trace, and request path; it never requires
 * who made the request or what they sent, so this runs as a defense-in-depth layer even though the
 * SDK's own conservative defaults already withhold this data.
 *
 * @param event - The captured error event about to be sent to Sentry/Bugsink.
 * @returns The same event with sensitive request and user fields removed.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.headers;
    delete event.request.query_string;
  }
  return event;
}
