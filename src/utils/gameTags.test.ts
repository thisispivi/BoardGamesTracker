import { describe, expect, it } from "vitest";

import type { CollectionGame } from "@/core";
import { buildGameTags } from "@/utils/gameTags";

const game: CollectionGame = {
  bggId: 1,
  bggRating: 7.5,
  categories: ["Economic", "Expansion for Base-game", "Card Game"],
  expandsBggIds: [],
  expansionBggIds: [],
  families: [],
  favorite: false,
  gameId: "game-id",
  gifted: false,
  hasPlayed: false,
  id: "item-id",
  imageUrl: null,
  isExpansion: false,
  maxPlayers: 4,
  maxPlaytime: 90,
  mechanics: ["Worker Placement", "Card Game"],
  minPlayers: 2,
  minPlaytime: 45,
  moneySpent: 0,
  name: "Brass",
  notes: "",
  personalRating: null,
  thumbnailUrl: null,
  weight: 3.286,
  yearPublished: 2018,
};

describe("buildGameTags", () => {
  it("drops expansion categories and keeps a shared label only once", () => {
    expect(buildGameTags(game, "en")).toEqual([
      { label: "Economic", tone: "category" },
      { label: "Card Game", tone: "category" },
      { label: "Worker Placement", tone: "mechanic" },
    ]);
  });

  it("localizes taxonomy labels for the active locale", () => {
    expect(buildGameTags(game, "it")).toContainEqual({
      label: "Piazzamento lavoratori",
      tone: "mechanic",
    });
  });
});
