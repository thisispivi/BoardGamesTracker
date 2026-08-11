import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { BETTER_AUTH_SECRET: "test-secret-value-long-enough-000000" },
}));
vi.mock("@/server/bgg/scrape", () => ({
  scrapeBggMetadata: vi.fn(async () => new Map()),
}));
vi.mock("@/server/discovery/search", () => ({
  searchBoardGames: vi.fn(async () => []),
}));

import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { discoverBoardGameByUrl } from "@/server/discovery/bggUrl";
import { searchBoardGames } from "@/server/discovery/search";

beforeEach(() => {
  vi.mocked(scrapeBggMetadata).mockResolvedValue(new Map());
  vi.mocked(searchBoardGames).mockResolvedValue([]);
});

describe("discoverBoardGameByUrl", () => {
  it("falls back to scraped search results when the BGG page is blocked", async () => {
    vi.mocked(searchBoardGames).mockResolvedValueOnce([
      {
        bggId: 380_135,
        bggUrl: "https://boardgamegeek.com/boardgame/380135",
        imageUrl: "https://cf.geekdo-images.com/dead-cells/cover.jpg",
        isExpansion: false,
        name: "Dead Cells: The Rogue-Lite Board Game",
        selectionToken: "search-token",
        yearPublished: 2024,
      },
    ]);

    const result = await discoverBoardGameByUrl(
      "https://boardgamegeek.com/boardgame/380135/dead-cells-the-rogue-lite-board-game",
    );

    expect(searchBoardGames).toHaveBeenCalledWith("380135");
    expect(result).toMatchObject({
      bggId: 380_135,
      imageUrl: "https://cf.geekdo-images.com/dead-cells/cover.jpg",
      name: "Dead Cells: The Rogue-Lite Board Game",
      yearPublished: 2024,
    });
    expect(result?.selectionToken).not.toBe("search-token");
  });

  it("keeps the pasted expansion section authoritative", async () => {
    vi.mocked(searchBoardGames).mockResolvedValueOnce([
      {
        bggId: 53_383,
        bggUrl: "https://boardgamegeek.com/boardgame/53383",
        imageUrl: null,
        isExpansion: false,
        name: "Ticket to Ride: Europa 1912",
        selectionToken: "search-token",
        yearPublished: 2009,
      },
    ]);

    const result = await discoverBoardGameByUrl(
      "https://boardgamegeek.com/boardgameexpansion/53383/ticket-to-ride-europa-1912",
    );

    expect(result).toMatchObject({
      bggUrl: "https://boardgamegeek.com/boardgameexpansion/53383",
      isExpansion: true,
    });
  });
});
