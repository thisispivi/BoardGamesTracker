import { describe, expect, it } from "vitest";

import { parseBoardGameUrl } from "@/server/discovery/result-parser";

describe("BoardGameGeek URL parsing", () => {
  it("accepts canonical game URLs with an optional slug", () => {
    expect(
      parseBoardGameUrl("https://boardgamegeek.com/boardgame/266192/wingspan"),
    ).toEqual({
      bggId: 266192,
      bggUrl: "https://boardgamegeek.com/boardgame/266192",
    });
    expect(
      parseBoardGameUrl("https://www.boardgamegeek.com/boardgame/13"),
    ).toEqual({
      bggId: 13,
      bggUrl: "https://boardgamegeek.com/boardgame/13",
    });
  });

  it.each([
    "http://boardgamegeek.com/boardgame/13",
    "https://example.com/boardgame/13",
    "https://boardgamegeek.com/thread/13",
  ])("rejects untrusted or non-game URLs: %s", (url) => {
    expect(parseBoardGameUrl(url)).toBeNull();
  });
});
