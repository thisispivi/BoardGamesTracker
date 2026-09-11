import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { consumeRateLimit } from "@/server/security/rateLimit";

describe("consumeRateLimit", () => {
  it("rejects requests after a fixed-window allowance is exhausted", () => {
    const key = `test:${crypto.randomUUID()}`;

    expect(consumeRateLimit(key, 2, 60_000)).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000)).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000)).toBe(false);
  });
});
