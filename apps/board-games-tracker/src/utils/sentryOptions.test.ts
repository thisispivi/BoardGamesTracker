import { describe, expect, it } from "vitest";

import { createSentryOptions } from "@/utils/sentryOptions";

describe("createSentryOptions", () => {
  it("keeps only Bugsink-supported error signalling enabled", () => {
    const options = createSentryOptions(
      "https://public@example.test/1",
      "staging",
      "release-123",
      "server",
    );

    expect(options).toMatchObject({
      dsn: "https://public@example.test/1",
      environment: "staging",
      release: "release-123",
      attachStacktrace: true,
      dataCollection: {
        cookies: false,
        httpBodies: [],
        httpHeaders: false,
        stackFrameVariables: false,
        urlQueryParams: false,
        userInfo: false,
      },
      sendClientReports: false,
      tracesSampleRate: 0,
      initialScope: {
        tags: {
          application: "board-games-tracker",
          runtime: "server",
        },
      },
    });
    expect(options.beforeSend).toBeTypeOf("function");
  });
});
