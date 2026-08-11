import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: {
    SEARXNG_URL: "http://searxng.test",
    BETTER_AUTH_SECRET: "test-secret-value-long-enough-000000",
  },
}));
vi.mock("@/server/bgg/scrape", () => ({
  scrapeBggMetadata: vi.fn(async () => new Map()),
}));

import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { searchBoardGames } from "@/server/discovery/search";

const searxngPayload = {
  results: Array.from({ length: 8 }, (_, index) => ({
    title: `Ticket to Ride ${index} (2004) | BoardGameGeek`,
    url: `https://boardgamegeek.com/boardgame/${9209 + index}/ticket-to-ride-${index}`,
    img_src: "",
  })),
};

/**
 * Serves metasearch results without making any real upstream requests.
 *
 * @returns A fetch stub covering general and image searches.
 */
function stubSearxng() {
  return vi.fn((input: URL | string) => {
    if (String(input).includes("searxng.test")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => searxngPayload,
      });
    }
    return Promise.reject(new Error("Unexpected upstream request."));
  });
}

describe("searchBoardGames", () => {
  it("populates the result name and image from each discovered BGG link", async () => {
    vi.mocked(scrapeBggMetadata).mockResolvedValueOnce(
      new Map([
        [
          9209,
          {
            bggId: 9209,
            bggRating: 7.4,
            categories: ["Trains"],
            description: "Build railway routes across North America.",
            families: [],
            imageUrl: "https://cf.geekdo-images.com/ticket/pic.jpg",
            isExpansion: false,
            maxPlayers: 5,
            maxPlaytime: 60,
            mechanics: ["Network and Route Building"],
            minPlayers: 2,
            minPlaytime: 30,
            name: "Ticket to Ride",
            weight: 1.8,
            yearPublished: 2004,
          },
        ],
      ]),
    );
    vi.stubGlobal("fetch", stubSearxng());

    const results = await searchBoardGames("ticket ride metadata test");

    expect(results[0]).toMatchObject({
      bggId: 9209,
      imageUrl: "https://cf.geekdo-images.com/ticket/pic.jpg",
      name: "Ticket to Ride",
      yearPublished: 2004,
    });
  });

  it("returns metasearch results promptly when metadata is unavailable", async () => {
    vi.stubGlobal("fetch", stubSearxng());

    const started = Date.now();
    const results = await searchBoardGames("ticket to ride");
    const elapsed = Date.now() - started;

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toContain("Ticket to Ride");
    expect(results[0]?.selectionToken).toBeTruthy();
    expect(elapsed).toBeLessThan(9_000);
  }, 30_000);

  it("uses scraped BGG gallery artwork when page metadata is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) => {
        const endpoint = new URL(String(input));
        const isImageSearch =
          endpoint.searchParams.get("categories") === "images";
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            results: isImageSearch
              ? [
                  {
                    img_src:
                      "https://cf.geekdo-images.com/dead-cells/pic8461280.jpg",
                    title: "BoardGameGeek",
                    url: "https://boardgamegeek.com/image/8461280/dead-cells-the-rogue-lite-board-game",
                  },
                ]
              : [
                  {
                    img_src: "",
                    title:
                      "Dead Cells: The Rogue-Lite Board Game | Board Game | BoardGameGeek",
                    url: "https://boardgamegeek.com/boardgame/380135/dead-cells-the-rogue-lite-board-game",
                  },
                ],
          }),
        };
      }),
    );

    const results = await searchBoardGames("dead cells image enrichment test");

    expect(results[0]).toMatchObject({
      bggId: 380_135,
      imageUrl: "https://cf.geekdo-images.com/dead-cells/pic8461280.jpg",
      name: "Dead Cells: The Rogue-Lite Board Game",
    });
  });

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

  it("still finds a precise match ranked far down the engine results", async () => {
    // The wanted edition sits at position 20, well past the returned page size.
    const results = [
      ...Array.from({ length: 19 }, (_, index) => ({
        title: `Ticket to Ride: Filler ${index} (2010) | BoardGameGeek`,
        url: `https://boardgamegeek.com/boardgame/${1000 + index}/filler-${index}`,
        img_src: "",
      })),
      {
        title: "Ticket to Ride: Northern Lights (2022) | BoardGameGeek",
        url: "https://boardgamegeek.com/boardgame/366835/ticket-to-ride-northern-lights",
        img_src: "",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) => ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () =>
          String(input).includes("searxng.test")
            ? { results }
            : { results: [] },
        text: async () => "",
      })),
    );

    const found = await searchBoardGames("ticket to ride northern lights");

    expect(found.map((game) => game.bggId)).toContain(366835);
  });
});
