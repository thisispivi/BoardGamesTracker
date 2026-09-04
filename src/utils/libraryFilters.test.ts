import { describe, expect, it } from "vitest";

import type { CollectionGame, LibraryFilters } from "@/core";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";

/**
 * Builds a complete game record with focused filter-test overrides.
 *
 * @param overrides - Fields that distinguish the game under test.
 * @returns A collection game suitable for browser filtering tests.
 */
function game(overrides: Partial<CollectionGame>): CollectionGame {
  return {
    bggId: 1,
    bggRating: 7.5,
    categories: ["Strategy"],
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
    mechanics: ["Drafting"],
    minPlayers: 2,
    minPlaytime: 30,
    moneySpent: 0,
    name: "Arboretum",
    notes: "",
    personalRating: null,
    thumbnailUrl: null,
    weight: 2.13,
    yearPublished: 2015,
    ...overrides,
  };
}

/**
 * Applies focused filter overrides to a fresh default filter state.
 *
 * @param overrides - Filter values exercised by the test.
 * @returns A complete shared library filter state.
 */
function filters(overrides: Partial<LibraryFilters>): LibraryFilters {
  return { ...createLibraryFilters(), ...overrides };
}

describe("filterAndSortLibraryGames", () => {
  const games = [
    game({ id: "b", name: "Brass", weight: 3.86, maxPlaytime: 120 }),
    game({ id: "a", name: "Azul", weight: 1.78, favorite: true }),
    game({
      categories: ["Expansion"],
      id: "e",
      isExpansion: true,
      maxPlayers: 5,
      mechanics: ["Deck Building"],
      minPlayers: 3,
      name: "Brass Expansion",
      weight: null,
    }),
  ];

  it("combines player, complexity, taxonomy, and favorite filters", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({
        categories: ["Strategy"],
        favoritesOnly: true,
        mechanics: ["Drafting"],
        players: 2,
        weight: "light",
      }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual(["Azul"]);
  });

  it("filters expansions and maximum duration independently", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({ gameType: "expansions", maxPlaytime: 90 }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual(["Brass Expansion"]);
  });

  it("sorts known complexity descending while keeping unrated games last", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({ sort: "weightDescending" }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual([
      "Brass",
      "Azul",
      "Brass Expansion",
    ]);
  });

  it("preserves explicit time ordering after fuzzy search", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({ query: "brass", sort: "timeAscending" }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual([
      "Brass Expansion",
      "Brass",
    ]);
  });

  it("keeps games with unknown duration last in ascending time order", () => {
    const result = filterAndSortLibraryGames(
      [
        game({ name: "Unknown", maxPlaytime: 0 }),
        game({ name: "Long", maxPlaytime: 120 }),
        game({ name: "Short", maxPlaytime: 30 }),
      ],
      filters({ sort: "timeAscending" }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual([
      "Short",
      "Long",
      "Unknown",
    ]);
  });
});
