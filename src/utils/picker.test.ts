import { describe, expect, it } from "vitest";

import type { PickableGame } from "@/core";
import { filterGames, pickRandomGame } from "@/utils/picker";

const games: PickableGame[] = [
  {
    gameId: "1",
    name: "Duel",
    minPlayers: 2,
    maxPlayers: 2,
    maxPlaytime: 30,
    weight: 2.1,
    favorite: true,
    isExpansion: false,
  },
  {
    gameId: "2",
    name: "Party",
    minPlayers: 4,
    maxPlayers: 10,
    maxPlaytime: 60,
    weight: 1.2,
    favorite: false,
    isExpansion: false,
  },
];

describe("game picker", () => {
  it("filters by all active constraints", () => {
    expect(
      filterGames(games, {
        players: 2,
        maxMinutes: 45,
        maxWeight: 3,
        favoritesOnly: true,
        excludeExpansions: true,
      }),
    ).toEqual([games[0]]);
  });

  it("returns null when no games qualify", () => {
    expect(
      pickRandomGame(games, {
        players: 3,
        maxMinutes: 0,
        maxWeight: 0,
        favoritesOnly: false,
        excludeExpansions: true,
      }),
    ).toBeNull();
  });

  it("uses the supplied random source", () => {
    expect(
      pickRandomGame(
        games,
        {
          players: 4,
          maxMinutes: 0,
          maxWeight: 0,
          favoritesOnly: false,
          excludeExpansions: true,
        },
        () => 0,
      ),
    )?.toBe(games[1]);
  });

  it("combines multi-select mechanic, theme, and expansion filters", () => {
    const expansion: PickableGame = {
      ...games[0]!,
      gameId: "3",
      isExpansion: true,
      mechanics: ["Drafting"],
      families: ["Fantasy"],
    };

    expect(
      filterGames([...games, expansion], {
        players: 2,
        maxMinutes: 0,
        maxWeight: 0,
        favoritesOnly: false,
        mechanics: ["Drafting"],
        themes: ["Fantasy"],
        excludeExpansions: true,
      }),
    ).toEqual([]);
  });
});
