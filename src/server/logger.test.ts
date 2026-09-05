import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { LOG_LEVEL: "info" } }));

import { log } from "@/server/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("structured logging", () => {
  it("redacts compound credential keys and protects the event envelope", () => {
    const output = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    log("warn", "operation_failed", {
      accessToken: "sensitive",
      smtpPassword: "sensitive",
      apiKey: "sensitive",
      actorId: "owner",
      message: "forged",
      level: "debug",
    });
    const [serialized] = output.mock.calls[0] ?? [];
    expect(serialized).toEqual(expect.stringContaining('"actorId":"owner"'));
    expect(serialized).toEqual(
      expect.stringContaining('"message":"operation_failed"'),
    );
    expect(serialized).not.toContain("sensitive");
    expect(serialized).not.toContain("forged");
  });
  it("suppresses debug entries below the configured threshold", () => {
    const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
    log("debug", "debug_event");
    expect(output).not.toHaveBeenCalled();
  });
});
