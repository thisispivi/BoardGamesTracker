import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { searchBggGames } from "@/server/discovery/bggSearch";

/**
 * Builds a stubbed BoardGameGeek search response.
 *
 * @param body - The JSON payload to return.
 * @param status - The HTTP status the stub reports.
 * @param contentType - The response content type the stub reports.
 * @returns A fetch stub yielding that response.
 */
function stubFetch(
  body: unknown,
  status = 200,
  contentType = "application/json; charset=utf-8",
) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    headers: new Headers({ "content-type": contentType }),
    json: async () => body,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchBggGames", () => {
  it("normalizes BoardGameGeek items into discovery candidates", async () => {
    vi.stubGlobal(
      "fetch",
      stubFetch({
        items: [
          {
            objectid: "9209",
            objecttype: "thing",
            name: "Ticket to Ride",
            yearpublished: 2004,
            href: "/boardgame/9209/ticket-to-ride",
          },
        ],
      }),
    );

    await expect(searchBggGames("ticket to ride")).resolves.toEqual([
      {
        bggId: 9209,
        bggUrl: "https://boardgamegeek.com/boardgame/9209",
        imageUrl: null,
        isExpansion: false,
        name: "Ticket to Ride",
        yearPublished: 2004,
      },
    ]);
  });

  it("drops unusable items and deduplicates repeated identifiers", async () => {
    vi.stubGlobal(
      "fetch",
      stubFetch({
        items: [
          { objectid: "13", objecttype: "thing", name: "Catan" },
          { objectid: "13", objecttype: "thing", name: "Catan duplicate" },
          { objectid: "0", objecttype: "thing", name: "Bad id" },
          { objectid: "77", objecttype: "thing", name: "   " },
          { objectid: "88", objecttype: "family", name: "Not a game" },
          {
            objectid: "99",
            objecttype: "thing",
            name: "Old",
            yearpublished: 12,
          },
        ],
      }),
    );

    const games = await searchBggGames("catan");

    expect(games.map((game) => game.bggId)).toEqual([13, 99]);
    expect(games[0]?.name).toBe("Catan");
    expect(games[1]?.yearPublished).toBeNull();
  });

  it("rejects a bot-protection challenge served as HTML", async () => {
    vi.stubGlobal(
      "fetch",
      stubFetch("<html>Just a moment...</html>", 403, "text/html"),
    );

    await expect(searchBggGames("ticket to ride")).rejects.toThrow(
      /BoardGameGeek search returned 403/,
    );
  });
});
