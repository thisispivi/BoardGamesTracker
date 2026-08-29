import { describe, expect, it } from "vitest";

import type { UserDataDocument, UserDataFormat } from "@/core";
import { parseUserData, serializeUserData } from "@/server/userData/formats";

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
      expandsBggIds: [],
      expansionBggIds: [403_217],
      categories: ["Card Game", "Civilization"],
      mechanics: ["Drafting"],
      families: ["Ancient"],
      favorite: true,
      personalRating: 9,
      notes: "Sleeved",
      moneySpent: 29.99,
      gifted: false,
    },
    {
      location: "wishlist",
      bggId: 224517,
      name: "Brass: Birmingham",
      description: "Build networks during the industrial revolution.",
      imageUrl: "https://cf.geekdo-images.com/wishlist-example.jpg",
      yearPublished: 2018,
      minPlayers: 2,
      maxPlayers: 4,
      minPlaytime: 60,
      maxPlaytime: 120,
      weight: 3.86,
      bggRating: 8.6,
      isExpansion: false,
      expandsBggIds: [],
      expansionBggIds: [],
      categories: ["Economic", "Industry / Manufacturing"],
      mechanics: ["Hand Management", "Network and Route Building"],
      families: ["Brass"],
      favorite: false,
      personalRating: null,
      notes: "Buy when it is back in stock",
      moneySpent: 0,
      gifted: false,
    },
  ],
};

/**
 * Builds a one-item JSON export whose complexity carries the given value.
 *
 * @param weight - Complexity written into the exported item.
 * @returns UTF-8 bytes of the resulting document.
 */
function documentWithWeight(weight: number): Uint8Array {
  const [item] = document.items;
  if (!item) {
    throw new Error("fixture document must contain an item");
  }
  return new TextEncoder().encode(
    JSON.stringify({ ...document, items: [{ ...item, weight }] }),
  );
}

describe("legacy complexity values", () => {
  it("imports an export whose unrated complexity was written as zero", async () => {
    const restored = await parseUserData(documentWithWeight(0), "json");
    expect(restored.items[0]?.weight).toBeNull();
  });

  it("still rejects a complexity below BGG's scale", async () => {
    await expect(
      parseUserData(documentWithWeight(0.5), "json"),
    ).rejects.toThrow();
  });
});

describe("portable user data formats", () => {
  for (const format of ["json", "csv", "xlsx", "sql"] as UserDataFormat[]) {
    it(`round-trips ${format.toUpperCase()}`, async () => {
      const output = await serializeUserData(document, format);
      const restored = await parseUserData(output, format);
      expect(restored).toEqual(document);
    });
  }

  it("imports legacy JSON backups without BGG relationship fields", async () => {
    const legacy = JSON.stringify(document, (key, value: unknown) =>
      ["expandsBggIds", "expansionBggIds"].includes(key) ? undefined : value,
    );

    const restored = await parseUserData(
      new TextEncoder().encode(legacy),
      "json",
    );

    expect(restored.items).toEqual(
      document.items.map((item) => ({
        ...item,
        expandsBggIds: [],
        expansionBggIds: [],
      })),
    );
  });

  it("never executes arbitrary SQL uploads", async () => {
    await expect(
      parseUserData(
        new TextEncoder().encode("DROP TABLE collection_items;"),
        "sql",
      ),
    ).rejects.toThrow("Invalid Board Games Tracker SQL export");
  });
});
