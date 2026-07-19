import { describe, expect, it } from "vitest";

import { parseBggGeekItemPayload } from "@/server/bgg/parser";

describe("parseBggGeekItemPayload", () => {
  /** Extracts normalized metadata from BGG's untrusted structured payload. */
  it("extracts categories and mechanics from the credits payload", () => {
    const metadata = parseBggGeekItemPayload(
      {
        item: {
          objectid: "68448",
          subtype: "boardgame",
          name: "7 Wonders",
          yearpublished: "2010",
          minplayers: "2",
          maxplayers: "7",
          minplaytime: "30",
          maxplaytime: "30",
          description: "Build an &lt;ancient&gt; city.<br>Draft cards.",
          images: {
            original:
              "https://cf.geekdo-images.com/example/filters:format(jpeg)/pic.jpg",
          },
          links: {
            boardgamecategory: [{ name: "Ancient" }, { name: "Card Game" }],
            boardgamemechanic: [
              { name: "Closed Drafting" },
              { name: "Hand Management" },
            ],
            boardgamefamily: [{ name: "Game: 7 Wonders" }],
          },
        },
      },
      68_448,
    );

    expect(metadata).toMatchObject({
      bggId: 68_448,
      name: "7 Wonders",
      categories: ["Ancient", "Card Game"],
      mechanics: ["Closed Drafting", "Hand Management"],
      families: ["Game: 7 Wonders"],
      isExpansion: false,
      minPlayers: 2,
      maxPlayers: 7,
      yearPublished: 2010,
    });
    expect(metadata?.description).toBe("Build an <ancient> city. Draft cards.");
  });

  /** Uses BGG's canonical subtype even when the category list is incomplete. */
  it("identifies an expansion from its BGG subtype", () => {
    const metadata = parseBggGeekItemPayload(
      {
        item: {
          objectid: "53383",
          subtype: "boardgameexpansion",
          name: "Ticket to Ride: Europa 1912",
          links: { boardgamecategory: [{ name: "Trains" }] },
        },
      },
      53_383,
    );

    expect(metadata?.isExpansion).toBe(true);
  });

  /** Rejects data that does not belong to the requested BGG record. */
  it("rejects a payload for a different game", () => {
    expect(
      parseBggGeekItemPayload(
        { item: { objectid: "1", name: "Wrong game" } },
        68_448,
      ),
    ).toBeNull();
  });
});
