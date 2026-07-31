import { describe, expect, it } from "vitest";

import {
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
  /** Accepts canonical HTTPS game links and normalizes their metadata. */
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

  /** Surfaces expansions from metasearch so they can be saved like games. */
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

  /** Accepts a BGG result paired with artwork from the official image CDN. */
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

  /** Rejects artwork hosted outside the allowlisted BGG image CDN. */
  it("rejects an untrusted image host", () => {
    expect(
      parseBoardGameImage(
        "https://boardgamegeek.com/boardgame/9209/ticket-to-ride",
        "https://example.com/pic123.jpg",
      ),
    ).toBeNull();
  });

  /** Rejects lookalike hosts even when their path resembles a valid game. */
  it("rejects a spoofed BGG hostname", () => {
    expect(
      parseBoardGameResult(
        "Wingspan | BoardGameGeek",
        "https://boardgamegeek.com.example.org/boardgame/266192/wingspan",
      ),
    ).toBeNull();
  });

  /** Rejects non-game sections of the trusted hostname. */
  it("rejects non-game BGG links", () => {
    expect(
      parseBoardGameResult(
        "A user profile | BoardGameGeek",
        "https://boardgamegeek.com/user/example",
      ),
    ).toBeNull();
  });
});
