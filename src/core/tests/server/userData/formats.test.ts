import { describe, expect, it } from "vitest";

import type { UserDataDocument, UserDataFormat } from "@/core";
import { parseUserData, serializeUserData } from "@/server/user-data/formats";

const document: UserDataDocument = {
  formatVersion: 1,
  exportedAt: "2026-07-18T12:00:00.000Z",
  profile: {
    name: "Andrea Piras",
    email: "andrea@example.com",
    currency: "EUR",
  },
  items: [
    {
      location: "collection",
      bggId: 68448,
      name: "=7 Wonders",
      description: "Draft a civilization.",
      imageUrl: "https://cf.geekdo-images.com/example.jpg",
      yearPublished: 2010,
      minPlayers: 2,
      maxPlayers: 7,
      minPlaytime: 30,
      maxPlaytime: 30,
      weight: 2.32,
      bggRating: 7.7,
      isExpansion: false,
      categories: ["Card Game", "Civilization"],
      mechanics: ["Drafting"],
      families: ["Ancient"],
      favorite: true,
      personalRating: 9,
      notes: "Sleeved",
      moneySpent: 29.99,
      gifted: false,
    },
  ],
};

describe("portable user data formats", () => {
  for (const format of ["json", "csv", "xlsx", "sql"] as UserDataFormat[]) {
    it(`round-trips ${format.toUpperCase()}`, async () => {
      const output = await serializeUserData(document, format);
      const restored = await parseUserData(output, format);
      expect(restored).toEqual(document);
    });
  }

  it("never executes arbitrary SQL uploads", async () => {
    await expect(
      parseUserData(
        new TextEncoder().encode("DROP TABLE collection_items;"),
        "sql",
      ),
    ).rejects.toThrow("Invalid Board Games Tracker SQL export");
  });
});
