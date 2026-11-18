import { describe, expect, it } from "vitest";

import {
  editCollectionItemSchema,
  gameDetailsSchema,
  purchaseCollectionItemSchema,
} from "@/core";

const details = {
  categories: "Strategy, Trains",
  description: "",
  families: "",
  gifted: null,
  imageUrl: "",
  maxPlayers: "5",
  maxPlaytime: "60",
  mechanics: "",
  minPlayers: "2",
  minPlaytime: "30",
  moneySpent: "39.90",
  weight: "",
  yearPublished: "",
};

describe("game details submitted from the add form", () => {
  it("coerces form text and reads blank optional fields as unknown", () => {
    expect(gameDetailsSchema.parse(details)).toMatchObject({
      gifted: false,
      imageUrl: null,
      maxPlayers: 5,
      moneySpent: 39.9,
      weight: null,
      yearPublished: null,
    });
  });

  it("records no price for a gift", () => {
    expect(
      gameDetailsSchema.parse({ ...details, gifted: "true" }).moneySpent,
    ).toBe(0);
  });

  it.each([
    { maxPlayers: "1" },
    { maxPlaytime: "10" },
    { yearPublished: "1500" },
    { imageUrl: "https://example.com/cover.jpg" },
    { moneySpent: "-1" },
    { weight: "7" },
  ])("rejects an impossible value: %j", (changes) => {
    expect(
      gameDetailsSchema.safeParse({ ...details, ...changes }).success,
    ).toBe(false);
  });
});

describe("purchases recorded on an existing entry", () => {
  const itemId = "00000000-0000-4000-8000-000000000001";

  it("clears the price of a gift when a wishlist game is bought", () => {
    expect(
      purchaseCollectionItemSchema.parse({
        gifted: "true",
        itemId,
        moneySpent: "25",
      }),
    ).toEqual({ gifted: true, itemId, moneySpent: 0 });
  });

  it("keeps a paid price and an empty rating on an edit", () => {
    expect(
      editCollectionItemSchema.parse({
        gifted: null,
        itemId,
        moneySpent: "25",
        notes: "  Birthday game  ",
        personalRating: "",
      }),
    ).toEqual({
      gifted: false,
      itemId,
      moneySpent: 25,
      notes: "Birthday game",
      personalRating: null,
    });
  });

  it("rejects an item identifier that is not a UUID", () => {
    expect(
      purchaseCollectionItemSchema.safeParse({
        gifted: null,
        itemId: "1 or 1=1",
        moneySpent: "25",
      }).success,
    ).toBe(false);
  });
});
