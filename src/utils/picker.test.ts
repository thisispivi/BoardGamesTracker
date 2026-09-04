import { describe, expect, it } from "vitest";

import type { CollectionGame } from "@/core";
import { pickRandomGame } from "@/utils/picker";

/**
 * Builds a minimal candidate record for the random selection tests.
 *
 * @param overrides - Fields that distinguish the candidate under test.
 * @returns A collection game usable as a picker candidate.
 */
function candidate(overrides: Partial<CollectionGame>): CollectionGame {
  return {
    bggId: 1,
    bggRating: null,
    categories: [],
    expansionBggIds: [],
    expandsBggIds: [],
    families: [],
    favorite: false,
    gameId: "game-id",
    gifted: false,
    id: "item-id",
    imageUrl: null,
    isExpansion: false,
    maxPlayers: 4,
    maxPlaytime: 60,
    mechanics: [],
    minPlayers: 2,
    minPlaytime: 30,
    moneySpent: 0,
    name: "Arboretum",
    notes: "",
    personalRating: null,
    thumbnailUrl: null,
    weight: null,
    yearPublished: null,
    ...overrides,
  };
}

describe("pickRandomGame", () => {
  const games = [
    candidate({ id: "duel", name: "Duel" }),
    candidate({ id: "party", name: "Party" }),
  ];

  it("returns null when no candidate qualifies", () => {
    expect(pickRandomGame([])).toBeNull();
  });

  it("uses the supplied random source", () => {
    expect(pickRandomGame(games, () => 0)).toBe(games[0]);
    expect(pickRandomGame(games, () => 0.99)).toBe(games[1]);
  });
});
