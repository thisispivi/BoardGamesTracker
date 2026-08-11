import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "@/utils/sentryScrub";

describe("scrubSentryEvent", () => {
  it("removes user identity and sensitive request fields", () => {
    const event = {
      exception: { values: [{ type: "Error", value: "boom" }] },
      request: {
        url: "https://example.test/admin?token=secret#private",
        method: "POST",
        cookies: { session: "secret" },
        data: { password: "hunter2" },
        env: { REMOTE_ADDR: "192.0.2.1" },
        headers: { authorization: "Bearer secret", "user-agent": "test" },
        query_string: "token=secret",
      },
      user: { id: "1", email: "person@example.test" },
    } as unknown as ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.env).toBeUndefined();
    expect(scrubbed.request?.headers).toBeUndefined();
    expect(scrubbed.request?.query_string).toBeUndefined();
    expect(scrubbed.request?.url).toBe("https://example.test/admin");
    expect(scrubbed.exception).toEqual(event.exception);
  });

  it("leaves an event with no request untouched beyond the user field", () => {
    const event = {
      exception: { values: [{ type: "Error", value: "boom" }] },
    } as unknown as ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request).toBeUndefined();
    expect(scrubbed.exception).toEqual(event.exception);
  });

  it("strips secrets from relative request URLs", () => {
    const event = {
      request: { url: "/collection?invite=secret#dialog" },
    } as unknown as ErrorEvent;

    expect(scrubSentryEvent(event).request?.url).toBe("/collection");
  });

  it("strips query data from navigation breadcrumbs", () => {
    const event = {
      breadcrumbs: [
        {
          category: "navigation",
          data: {
            from: "/login?token=secret",
            to: "https://example.test/reset-password?token=secret#form",
          },
        },
      ],
    } as unknown as ErrorEvent;

    const breadcrumb = scrubSentryEvent(event).breadcrumbs?.[0];

    expect(breadcrumb?.data?.from).toBe("/login");
    expect(breadcrumb?.data?.to).toBe("https://example.test/reset-password");
  });
});
