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
 * Strips user identity and sensitive request or navigation data from an outgoing error event.
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
