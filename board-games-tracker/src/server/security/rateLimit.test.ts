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

  it("keeps an exhausted counter when another namespace floods the limiter", () => {
    const victim = `victim:${crypto.randomUUID()}`;
    expect(consumeRateLimit(victim, 1, 60_000)).toBe(true);
    expect(consumeRateLimit(victim, 1, 60_000)).toBe(false);

    for (let index = 0; index < 10_001; index += 1) {
      consumeRateLimit(`flood:${index}`, 1, 60_000);
    }

    expect(consumeRateLimit(victim, 1, 60_000)).toBe(false);
  });

  it("evicts the oldest counter once its own namespace is full", () => {
    const oldest = "crowded:oldest";
    expect(consumeRateLimit(oldest, 1, 60_000)).toBe(true);
    expect(consumeRateLimit(oldest, 1, 60_000)).toBe(false);

    for (let index = 0; index < 10_000; index += 1) {
      consumeRateLimit(`crowded:${index}`, 1, 60_000);
    }

    expect(consumeRateLimit(oldest, 1, 60_000)).toBe(true);
  });
});
