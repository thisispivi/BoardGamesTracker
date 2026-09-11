import { afterEach, describe, expect, it, vi } from "vitest";

import { TtlCache } from "@/utils/ttlCache";

afterEach(() => {
  vi.useRealTimers();
});

describe("TtlCache", () => {
  it("returns stored values until their lifetime elapses", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1_000);
    cache.set("kittens", "boom");

    expect(cache.get("kittens")).toBe("boom");
    vi.advanceTimersByTime(999);
    expect(cache.get("kittens")).toBe("boom");
    vi.advanceTimersByTime(2);
    expect(cache.get("kittens")).toBeUndefined();
  });

  it("evicts the least recently used entry at capacity", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("reads through peek without recording the access", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.peek("a");
    cache.set("c", 3);

    expect(cache.peek("a")).toBeUndefined();
    expect(cache.peek("b")).toBe(2);
    expect(cache.peek("c")).toBe(3);
  });

  it("hides an expired entry from peek without evicting it", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1_000);
    cache.set("kittens", "boom");
    vi.advanceTimersByTime(1_001);

    expect(cache.peek("kittens")).toBeUndefined();
  });
});
