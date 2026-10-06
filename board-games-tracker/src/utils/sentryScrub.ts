import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Removes query parameters and fragments while preserving a useful request path.
 *
 * @param value - The absolute or relative URL to sanitize.
 * @returns The URL without its query string or fragment.
 */
function stripUrlSecrets(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
}

/**
 * Strips user identity and sensitive request data from an outgoing error event.
 *
 * Fixing an error needs the exception, stack trace, and request path, never who
 * made the request or what they sent. The SDK's defaults already withhold most
 * of this; stripping it again means a change to those defaults cannot leak it.
 *
 * @param event - The captured error event about to be sent to Sentry/Bugsink.
 * @returns The same event with sensitive request and user fields removed.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.env;
    delete event.request.headers;
    delete event.request.query_string;
    if (event.request.url) {
      event.request.url = stripUrlSecrets(event.request.url);
    }
  }
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (!breadcrumb.data) {
      continue;
    }
    for (const key of ["from", "to", "url"]) {
      const value = breadcrumb.data[key];
      if (typeof value === "string") {
        breadcrumb.data[key] = stripUrlSecrets(value);
      }
    }
  }
  return event;
}
