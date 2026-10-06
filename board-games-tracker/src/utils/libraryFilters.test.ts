import { describe, expect, it } from "vitest";

import type { CollectionGame, LibraryFilters } from "@/core";
import {
  clampRange,
  countActiveFilters,
  createLibraryFilters,
  filterAndSortLibraryGames,
  isFullRange,
  playerRangeBounds,
  playtimeRangeBounds,
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
    hasPlayed: false,
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
    game({
      favorite: true,
      hasPlayed: true,
      id: "a",
      name: "Azul",
      weight: 1.78,
    }),
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

  it("combines player, complexity, taxonomy, favorite, and played filters", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({
        categories: ["Strategy"],
        favoriteFilter: "yes",
        mechanics: ["Drafting"],
        players: { max: 2, min: 2 },
        playedFilter: "yes",
        weight: "light",
      }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual(["Azul"]);
  });

  it("filters explicit negative favorite and played states", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({ favoriteFilter: "no", playedFilter: "no" }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual([
      "Brass",
      "Brass Expansion",
    ]);
  });

  it("filters expansions and maximum duration independently", () => {
    const result = filterAndSortLibraryGames(
      games,
      filters({ gameType: "expansions", playtime: { max: 90, min: 15 } }),
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

  it("keeps every game while a range still spans its full bounds", () => {
    const result = filterAndSortLibraryGames(
      [game({ name: "Unknown", maxPlaytime: 0 })],
      filters({}),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual(["Unknown"]);
  });

  it("drops games with an unknown duration once playtime is narrowed", () => {
    const result = filterAndSortLibraryGames(
      [game({ name: "Unknown", maxPlaytime: 0 })],
      filters({ playtime: { max: 120, min: 0 } }),
      "en",
    );

    expect(result).toEqual([]);
  });

  it("keeps games whose player span overlaps the selected range", () => {
    const result = filterAndSortLibraryGames(
      [
        game({ name: "Duel", maxPlayers: 2, minPlayers: 2 }),
        game({ name: "Party", maxPlayers: 10, minPlayers: 6 }),
      ],
      filters({ players: { max: 4, min: 3 } }),
      "en",
    );

    expect(result.map(({ name }) => name)).toEqual([]);
  });
});

describe("range helpers", () => {
  it("treats only a range covering its bounds as inactive", () => {
    expect(isFullRange(playerRangeBounds, playerRangeBounds)).toBe(true);
    expect(isFullRange({ max: 4, min: 1 }, playerRangeBounds)).toBe(false);
  });

  it("clamps out-of-bounds endpoints back inside the offered range", () => {
    expect(clampRange({ max: 900, min: -30 }, playtimeRangeBounds)).toEqual(
      playtimeRangeBounds,
    );
  });

  it("reorders endpoints when the lower one overtakes the upper one", () => {
    expect(clampRange({ max: 2, min: 9 }, playerRangeBounds)).toEqual({
      max: 9,
      min: 2,
    });
  });
});

describe("countActiveFilters", () => {
  it("counts nothing for a freshly created filter state", () => {
    expect(
      countActiveFilters(createLibraryFilters(), {
        favorites: true,
        played: true,
        query: true,
      }),
    ).toBe(0);
  });

  it("ignores ordering and facets the surface does not expose", () => {
    const filters: LibraryFilters = {
      ...createLibraryFilters(),
      favoriteFilter: "yes",
      playedFilter: "no",
      query: "  root  ",
      sort: "weightDescending",
    };
    expect(
      countActiveFilters(filters, {
        favorites: false,
        played: false,
        query: false,
      }),
    ).toBe(0);
    expect(
      countActiveFilters(filters, {
        favorites: true,
        played: true,
        query: true,
      }),
    ).toBe(3);
  });

  it("counts a narrowed range but not a blank search", () => {
    const filters: LibraryFilters = {
      ...createLibraryFilters(),
      players: { max: 4, min: 3 },
      query: "   ",
      weight: "heavy",
    };
    expect(
      countActiveFilters(filters, {
        favorites: true,
        played: true,
        query: true,
      }),
    ).toBe(2);
  });
});
