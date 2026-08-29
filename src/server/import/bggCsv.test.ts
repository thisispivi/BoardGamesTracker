import { describe, expect, it } from "vitest";

import { parseBggCollectionCsv } from "@/server/import/bggCsv";

const header = [
  "objectname",
  "objectid",
  "own",
  "minplayers",
  "maxplayers",
  "minplaytime",
  "maxplaytime",
  "yearpublished",
  "avgweight",
  "baverage",
  "rating",
  "numplays",
  "comment",
  "privatecomment",
  "itemtype",
].join(",");

describe("parseBggCollectionCsv", () => {
  it("normalizes an owned game", () => {
    const result = parseBggCollectionCsv(
      `${header}\n"Ticket to Ride",9209,1,2,5,30,60,2004,1.85,7.3,8,12,"Family favorite","Sleeved",standalone`,
    );
    expect(result).toEqual({
      games: [
        expect.objectContaining({
          bggId: 9209,
          maxPlayers: 5,
          maxPlaytime: 60,
          name: "Ticket to Ride",
          notes: "Family favorite\n\nSleeved",
          personalRating: 8,
          yearPublished: 2004,
        }),
      ],
      invalid: 0,
      skipped: 0,
    });
  });

  it("identifies an expansion from the CSV item type", () => {
    const result = parseBggCollectionCsv(
      `${header}\n"Ticket to Ride: Europa 1912",53383,1,2,5,30,60,2009,1.6,8,0,0,,,expansion`,
    );

    expect(result.games[0]).toMatchObject({
      categories: ["Expansion"],
      isExpansion: true,
    });
  });

  it("skips a game that is not owned", () => {
    const result = parseBggCollectionCsv(
      `${header}\nWanted Game,123,0,1,4,20,40,2020,2,7,0,0,,,standalone`,
    );
    expect(result).toEqual({ games: [], invalid: 0, skipped: 1 });
  });

  it("rejects an unrelated CSV", () => {
    expect(() => parseBggCollectionCsv("name,id\nExample,1")).toThrow(
      "not a supported BoardGameGeek collection export",
    );
  });
});
