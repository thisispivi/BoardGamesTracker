import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubSentryEvent } from "@/utils/sentryScrub";

describe("scrubSentryEvent", () => {
  it("removes user identity and sensitive request fields", () => {
    const event = {
      exception: { values: [{ type: "Error", value: "boom" }] },
      request: {
        url: "https://example.test/admin",
        method: "POST",
        cookies: { session: "secret" },
        data: { password: "hunter2" },
        headers: { authorization: "Bearer secret", "user-agent": "test" },
        query_string: "token=secret",
      },
      user: { id: "1", email: "person@example.test" },
    } as unknown as ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.data).toBeUndefined();
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
});
