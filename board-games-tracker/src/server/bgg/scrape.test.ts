import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { scrapeBggMetadata } from "@/server/bgg/scrape";

/**
 * Builds the smallest public page markup the HTML parser accepts for one game.
 *
 * @param bggId - Identifier the page's canonical URL and title describe.
 * @param name - Title shown in the page's Open Graph metadata.
 * @returns Markup carrying the canonical URL, title, and one player count.
 */
function gamePage(bggId: number, name: string): string {
  return `<html><head>
    <meta property="og:url" content="https://boardgamegeek.com/boardgame/${bggId}/slug">
    <meta property="og:title" content="${name} (2004) | BoardGameGeek">
  </head><body><script>{"minplayers":"2","maxplayers":"5"}</script></body></html>`;
}

/**
 * Answers one request the way BoardGameGeek's public page would.
 *
 * @param status - HTTP status of the reply.
 * @param body - HTML body, empty for a redirect.
 * @param location - Redirect target header, when the status is a redirect.
 * @returns A response the scraper can consume.
 */
function htmlResponse(status: number, body = "", location?: string): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...(location ? { location } : {}),
    },
  });
}

/**
 * Installs a fetch stub that answers the JSON API with an outage and pages by URL.
 *
 * @param pages - Replies keyed by the exact page URL requested.
 * @returns The stub, so a test can inspect which URLs were requested.
 */
function stubBggFetch(
  pages: Record<string, Response>,
): ReturnType<typeof vi.fn> {
  const fetchStub = vi.fn(async (input: URL | RequestInfo) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith("https://api.geekdo.com/")) {
      return new Response(null, { status: 503 });
    }
    return pages[url] ?? new Response(null, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchStub);
  return fetchStub;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("scrapeBggMetadata", () => {
  it("follows BoardGameGeek's canonical redirect to the slugged page", async () => {
    const fetchStub = stubBggFetch({
      "https://boardgamegeek.com/boardgame/9209": htmlResponse(
        301,
        "",
        "/boardgame/9209/ticket-to-ride",
      ),
      "https://boardgamegeek.com/boardgame/9209/ticket-to-ride": htmlResponse(
        200,
        gamePage(9209, "Ticket to Ride"),
      ),
    });

    const metadata = await scrapeBggMetadata([9209]);

    expect(metadata.get(9209)?.name).toBe("Ticket to Ride");
    expect(fetchStub.mock.calls.map((call) => String(call[0]))).toContain(
      "https://boardgamegeek.com/boardgame/9209/ticket-to-ride",
    );
  });

  it("never requests a redirect that leaves BoardGameGeek", async () => {
    const fetchStub = stubBggFetch({
      "https://boardgamegeek.com/boardgame/13": htmlResponse(
        302,
        "",
        "https://boardgamegeek.com.evil.test/boardgame/13/catan",
      ),
    });

    expect((await scrapeBggMetadata([13])).has(13)).toBe(false);
    expect(fetchStub.mock.calls.map((call) => String(call[0]))).not.toContain(
      "https://boardgamegeek.com.evil.test/boardgame/13/catan",
    );
  });

  it("refuses a page that keeps on redirecting", async () => {
    const fetchStub = stubBggFetch({
      "https://boardgamegeek.com/boardgame/822": htmlResponse(
        301,
        "",
        "https://boardgamegeek.com/boardgame/822/carcassonne",
      ),
      "https://boardgamegeek.com/boardgame/822/carcassonne": htmlResponse(
        301,
        "",
        "https://boardgamegeek.com/boardgame/822/carcassonne-2",
      ),
    });

    expect((await scrapeBggMetadata([822])).has(822)).toBe(false);
    expect(fetchStub.mock.calls.map((call) => String(call[0]))).not.toContain(
      "https://boardgamegeek.com/boardgame/822/carcassonne-2",
    );
  });

  it("rejects a page whose canonical identity is another game", async () => {
    stubBggFetch({
      "https://boardgamegeek.com/boardgame/30549": htmlResponse(
        200,
        gamePage(13, "Catan"),
      ),
    });

    expect((await scrapeBggMetadata([30549])).has(30549)).toBe(false);
  });
});
