import { describe, expect, it } from "vitest";

import { gameMetadataSchema } from "@/core";

const metadata = {
  gameId: "00000000-0000-4000-8000-000000000001",
  name: "Catan",
  bggRating: null,
  weight: null,
  yearPublished: null,
  minPlayers: "2",
  maxPlayers: "4",
  minPlaytime: "30",
  maxPlaytime: "60",
  isExpansion: "false",
};

describe("administrator metadata validation", () => {
  it("accepts form numbers and deliberate empty ratings", () => {
    expect(gameMetadataSchema.parse(metadata)).toMatchObject({
      minPlayers: 2,
      maxPlayers: 4,
      weight: null,
    });
  });
  it.each([
    { maxPlayers: "1" },
    { maxPlaytime: "20" },
    { weight: "invalid" },
    { bggRating: "99" },
    { yearPublished: "never" },
  ])("rejects malformed values and reversed ranges: %j", (changes) => {
    expect(
      gameMetadataSchema.safeParse({ ...metadata, ...changes }).success,
    ).toBe(false);
  });
});
