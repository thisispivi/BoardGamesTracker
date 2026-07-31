import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: {
    SEARXNG_URL: "http://searxng.test",
    BETTER_AUTH_SECRET: "test-secret-value-long-enough-000000",
  },
}));

import { searchBoardGames } from "@/server/discovery/search";

const searxngPayload = {
  results: Array.from({ length: 8 }, (_, index) => ({
    title: `Ticket to Ride ${index} (2004) | BoardGameGeek`,
    url: `https://boardgamegeek.com/boardgame/${9209 + index}/ticket-to-ride-${index}`,
    img_src: "",
  })),
};

/**
 * Serves metasearch instantly while BoardGameGeek hangs until it is aborted.
 *
 * An unreachable host does not refuse a connection, it simply never answers,
 * which is the case that previously stalled a search for almost a minute.
 *
 * @returns A fetch stub covering both upstreams.
 */
function stubUnreachableBgg() {
  return vi.fn((input: URL | string, init?: { signal?: AbortSignal }) => {
    if (String(input).includes("searxng.test")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => searxngPayload,
      });
    }
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new Error("TimeoutError")),
      );
    });
  });
}

describe("searchBoardGames", () => {
  it("returns metasearch results promptly when BoardGameGeek never answers", async () => {
    vi.stubGlobal("fetch", stubUnreachableBgg());

    const started = Date.now();
    const results = await searchBoardGames("ticket to ride");
    const elapsed = Date.now() - started;

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toContain("Ticket to Ride");
    expect(results[0]?.selectionToken).toBeTruthy();
    expect(elapsed).toBeLessThan(9_000);
  }, 30_000);

  it("retries the upstream instead of pinning an empty answer", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ results: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await searchBoardGames("a query that finds nothing");
    const afterFirst = fetchMock.mock.calls.length;
    await searchBoardGames("a query that finds nothing");

    expect(fetchMock.mock.calls.length).toBeGreaterThan(afterFirst);
  });
});
