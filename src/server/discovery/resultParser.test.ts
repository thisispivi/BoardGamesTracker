import { describe, expect, it } from "vitest";

import {
  parseBoardGameArtwork,
  parseBoardGameImage,
  parseBoardGameResult,
  parseBoardGameUrl,
} from "@/server/discovery/resultParser";

describe("BoardGameGeek URL parsing", () => {
  it("accepts canonical game URLs with an optional slug", () => {
    expect(
      parseBoardGameUrl("https://boardgamegeek.com/boardgame/266192/wingspan"),
    ).toEqual({
      bggId: 266192,
      bggUrl: "https://boardgamegeek.com/boardgame/266192",
      isExpansion: false,
    });
    expect(
      parseBoardGameUrl("https://www.boardgamegeek.com/boardgame/13"),
    ).toEqual({
      bggId: 13,
      bggUrl: "https://boardgamegeek.com/boardgame/13",
      isExpansion: false,
    });
  });

  it("rebuilds a canonical URL from deep sub-paths, queries, and fragments", () => {
    expect(
      parseBoardGameUrl(
        "https://boardgamegeek.com/boardgame/172225/exploding-kittens/marketplace/boardgameexpansions",
      ),
    ).toEqual({
      bggId: 172225,
      bggUrl: "https://boardgamegeek.com/boardgame/172225",
      isExpansion: false,
    });
    expect(
      parseBoardGameUrl(
        "  http://www.boardgamegeek.com/boardgame/13/catan?sort=hot#comments  ",
      ),
    ).toEqual({
      bggId: 13,
      bggUrl: "https://boardgamegeek.com/boardgame/13",
      isExpansion: false,
    });
    expect(parseBoardGameUrl("boardgamegeek.com/boardgame/13")).toEqual({
      bggId: 13,
      bggUrl: "https://boardgamegeek.com/boardgame/13",
      isExpansion: false,
    });
  });

  it("marks expansion and accessory sections as expansions", () => {
    expect(
      parseBoardGameUrl(
        "https://boardgamegeek.com/boardgameexpansion/260214/exploding-kittens-streaking-kittens",
      ),
    ).toEqual({
      bggId: 260214,
      bggUrl: "https://boardgamegeek.com/boardgameexpansion/260214",
      isExpansion: true,
    });
    expect(
      parseBoardGameUrl("https://boardgamegeek.com/boardgameaccessory/22551"),
    ).toEqual({
      bggId: 22551,
      bggUrl: "https://boardgamegeek.com/boardgameaccessory/22551",
      isExpansion: true,
    });
  });

  it.each([
    "https://example.com/boardgame/13",
    "https://boardgamegeek.com.example.org/boardgame/13",
    "https://boardgamegeek.com/thread/13",
    "https://boardgamegeek.com/user/example",
    "https://boardgamegeek.com/boardgame/0",
    "https://boardgamegeek.com/boardgame/10000001",
    "javascript:alert(1)//boardgamegeek.com/boardgame/13",
    "",
  ])("rejects untrusted or non-game URLs: %s", (url) => {
    expect(parseBoardGameUrl(url)).toBeNull();
  });
});

describe("parseBoardGameResult", () => {
  it("parses a canonical BGG result", () => {
    expect(
      parseBoardGameResult(
        "Wingspan (2019) | Board Game | BoardGameGeek",
        "https://boardgamegeek.com/boardgame/266192/wingspan",
      ),
    ).toEqual({
      bggId: 266192,
      bggUrl: "https://boardgamegeek.com/boardgame/266192",
      imageUrl: null,
      isExpansion: false,
      name: "Wingspan",
      yearPublished: 2019,
    });
  });

  it("removes a truncated Board Game suffix from a result title", () => {
    expect(
      parseBoardGameResult(
        "Dead Cells: The Rogue-Lite Board Game | Board Game |",
        "https://boardgamegeek.com/boardgame/380135/dead-cells-the-rogue-lite-board-game",
      )?.name,
    ).toBe("Dead Cells: The Rogue-Lite Board Game");
    expect(
      parseBoardGameResult(
        "Dead Cells: The Rogue-Lite Board Game | Board... | BoardGameGeek",
        "https://boardgamegeek.com/boardgame/380135/dead-cells-the-rogue-lite-board-game",
      )?.name,
    ).toBe("Dead Cells: The Rogue-Lite Board Game");
  });

  it("parses an expansion result", () => {
    expect(
      parseBoardGameResult(
        "Exploding Kittens: Streaking Kittens (2018) | BoardGameGeek",
        "https://boardgamegeek.com/boardgameexpansion/260214/exploding-kittens-streaking-kittens",
      ),
    ).toEqual({
      bggId: 260214,
      bggUrl: "https://boardgamegeek.com/boardgameexpansion/260214",
      imageUrl: null,
      isExpansion: true,
      name: "Exploding Kittens: Streaking Kittens",
      yearPublished: 2018,
    });
  });

  it("parses a secure BGG image result", () => {
    expect(
      parseBoardGameImage(
        "https://boardgamegeek.com/boardgame/9209/ticket-to-ride",
        "https://cf.geekdo-images.com/example/pic123.jpg",
      ),
    ).toEqual({
      bggId: 9209,
      imageUrl: "https://cf.geekdo-images.com/example/pic123.jpg",
    });
  });

  it("rejects an untrusted image host", () => {
    expect(
      parseBoardGameImage(
        "https://boardgamegeek.com/boardgame/9209/ticket-to-ride",
        "https://example.com/pic123.jpg",
      ),
    ).toBeNull();
  });

  it("accepts CDN artwork from a matching BGG image page", () => {
    expect(
      parseBoardGameArtwork(
        "https://boardgamegeek.com/image/8461280/dead-cells-the-rogue-lite-board-game",
        "https://cf.geekdo-images.com/dead-cells/pic8461280.jpg",
        "Dead Cells: The Rogue-Lite Board Game",
      ),
    ).toBe("https://cf.geekdo-images.com/dead-cells/pic8461280.jpg");
  });

  it("rejects artwork from a different BGG game's image page", () => {
    expect(
      parseBoardGameArtwork(
        "https://boardgamegeek.com/image/1924077/ticket-to-ride-europe",
        "https://cf.geekdo-images.com/europe/pic1924077.jpg",
        "Ticket to Ride",
      ),
    ).toBeNull();
  });

  it("rejects a spoofed BGG hostname", () => {
    expect(
      parseBoardGameResult(
        "Wingspan | BoardGameGeek",
        "https://boardgamegeek.com.example.org/boardgame/266192/wingspan",
      ),
    ).toBeNull();
  });

  it("rejects non-game BGG links", () => {
    expect(
      parseBoardGameResult(
        "A user profile | BoardGameGeek",
        "https://boardgamegeek.com/user/example",
      ),
    ).toBeNull();
  });
});
