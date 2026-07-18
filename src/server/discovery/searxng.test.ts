import { describe, expect, it } from "vitest";

import {
  parseBoardGameImage,
  parseBoardGameResult,
} from "@/server/discovery/result-parser";

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
      name: "Wingspan",
      yearPublished: 2019,
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
