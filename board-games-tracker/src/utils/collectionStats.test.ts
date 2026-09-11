import { describe, expect, it } from "vitest";

import type { StatGame } from "@/core";
import { calculateCollectionStats } from "@/utils/collectionStats";

/**
 * Builds a complete statistics fixture from focused field overrides.
 *
 * @param overrides - Fields that differ from the neutral game fixture.
 * @returns A game suitable for collection-statistics tests.
 */
function game(overrides: Partial<StatGame>): StatGame {
  return {
    bggId: 1,
    categories: [],
    favorite: false,
    gifted: false,
    hasPlayed: false,
    isExpansion: false,
    maxPlayers: 0,
    maxPlaytime: 0,
    mechanics: [],
    minPlayers: 0,
    minPlaytime: 0,
    moneySpent: 0,
    name: "Game",
    weight: null,
    yearPublished: null,
    ...overrides,
  };
}

describe("calculateCollectionStats", () => {
  it("calculates spend and excludes expansion taxonomy noise", () => {
    const stats = calculateCollectionStats([
      game({
        name: "Alpha",
        moneySpent: 20,
        categories: ["Strategy"],
        mechanics: ["Drafting"],
        weight: 2.4,
      }),
      game({
        bggId: 2,
        name: "Beta expansion",
        moneySpent: 10,
        isExpansion: true,
        categories: ["Expansion for Base-game", "Strategy"],
        mechanics: ["Drafting"],
        weight: 4.2,
      }),
    ]);

    expect(stats.totalSpent).toBe(30);
    expect(stats.averageSpent).toBe(15);
    expect(stats.medianSpent).toBe(15);
    expect(stats.categories).toEqual([{ name: "Strategy", value: 2 }]);
    expect(stats.mechanics[0]).toEqual({ name: "Drafting", value: 2 });
    expect(stats.complexity).toEqual([
      { key: "light", value: 0 },
      { key: "medium", value: 1 },
      { key: "heavy", value: 0 },
      { key: "veryHeavy", value: 1 },
    ]);
    expect(stats.averageWeight).toBe(3.3);
    expect(stats.easiestGames).toEqual([{ name: "Alpha", value: 2.4 }]);
    expect(stats.hardestGames).toEqual([]);
  });

  it("ranks the eight lightest and the eight heaviest rated base games", () => {
    const stats = calculateCollectionStats([
      ...Array.from({ length: 20 }, (_, index) =>
        game({
          bggId: index + 1,
          name: `Game ${index}`,
          weight: 1 + index / 5,
        }),
      ),
      game({ bggId: 30, name: "Unrated" }),
      game({ bggId: 31, isExpansion: true, name: "Add-on", weight: 5 }),
    ]);

    expect(stats.easiestGames.map((datum) => datum.name)).toEqual([
      "Game 0",
      "Game 1",
      "Game 2",
      "Game 3",
      "Game 4",
      "Game 5",
      "Game 6",
      "Game 7",
    ]);
    expect(stats.hardestGames.map((datum) => datum.name)).toEqual([
      "Game 19",
      "Game 18",
      "Game 17",
      "Game 16",
      "Game 15",
      "Game 14",
      "Game 13",
      "Game 12",
    ]);
  });

  it("splits a small rated shelf so no game is both easiest and hardest", () => {
    const stats = calculateCollectionStats(
      [1.5, 3, 2, 4.5, 2.5].map((weight, index) =>
        game({ bggId: index + 1, name: `Weight ${weight}`, weight }),
      ),
    );

    expect(stats.easiestGames.map((datum) => datum.name)).toEqual([
      "Weight 1.5",
      "Weight 2",
      "Weight 2.5",
    ]);
    expect(stats.hardestGames.map((datum) => datum.name)).toEqual([
      "Weight 4.5",
      "Weight 3",
    ]);
  });

  it("counts played base games without counting played expansions", () => {
    const stats = calculateCollectionStats([
      game({ hasPlayed: true, name: "Played" }),
      game({ bggId: 2, name: "Waiting" }),
      game({ bggId: 3, hasPlayed: true, isExpansion: true, name: "Add-on" }),
    ]);

    expect(stats.playedBaseGames).toBe(1);
    expect(stats.baseGames).toBe(2);
  });

  it("counts gifts as recorded prices without adding purchase spend", () => {
    const stats = calculateCollectionStats([
      game({ name: "Gift", gifted: true }),
      game({ bggId: 2, name: "Purchase", moneySpent: 30 }),
    ]);

    expect(stats.pricedItems).toBe(2);
    expect(stats.totalSpent).toBe(30);
    expect(stats.averageSpent).toBe(15);
    expect(stats.medianSpent).toBe(15);
    expect(stats.mostExpensive).toEqual([{ name: "Purchase", value: 30 }]);
  });

  it("reports no average when nothing in the collection is rated or timed", () => {
    const stats = calculateCollectionStats([game({ name: "Unknown" })]);

    expect(stats.averageWeight).toBeNull();
    expect(stats.averagePlaytime).toBeNull();
    expect(stats.decades).toEqual([]);
  });

  it("counts a game once for every table size inside its player range", () => {
    const stats = calculateCollectionStats([
      game({ name: "Duel", minPlayers: 2, maxPlayers: 2 }),
      game({ bggId: 2, name: "Party", minPlayers: 3, maxPlayers: 12 }),
      game({
        bggId: 3,
        name: "Expansion",
        isExpansion: true,
        minPlayers: 1,
        maxPlayers: 1,
      }),
    ]);

    expect(stats.playerCounts).toEqual([
      { players: 1, value: 0 },
      { players: 2, value: 1 },
      { players: 3, value: 1 },
      { players: 4, value: 1 },
      { players: 5, value: 1 },
      { players: 6, value: 1 },
      { players: 7, value: 1 },
      { players: 8, value: 1 },
    ]);
  });

  it("bands session length by its upper bound and falls back to the lower one", () => {
    const stats = calculateCollectionStats([
      game({ name: "Filler", maxPlaytime: 20 }),
      game({ bggId: 2, name: "Short", maxPlaytime: 45 }),
      game({ bggId: 3, name: "Medium", minPlaytime: 90 }),
      game({ bggId: 4, name: "Epic", minPlaytime: 60, maxPlaytime: 240 }),
    ]);

    expect(stats.playtime).toEqual([
      { key: "quick", value: 1 },
      { key: "short", value: 1 },
      { key: "medium", value: 1 },
      { key: "long", value: 1 },
    ]);
    expect(stats.averagePlaytime).toBe(98.75);
  });

  it("keeps empty decades between the oldest and newest publication", () => {
    const stats = calculateCollectionStats([
      game({ name: "Classic", yearPublished: 1995 }),
      game({ bggId: 2, name: "Modern", yearPublished: 2017 }),
      game({ bggId: 3, name: "Undated", yearPublished: 1200 }),
    ]);

    expect(stats.decades).toEqual([
      { decade: 1990, value: 1 },
      { decade: 2000, value: 0 },
      { decade: 2010, value: 1 },
    ]);
  });
});
