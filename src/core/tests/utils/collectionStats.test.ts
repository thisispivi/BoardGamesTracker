import { describe, expect, it } from "vitest";

import type { StatGame } from "@/core";
import { calculateCollectionStats } from "@/lib/collection-stats";

const game = (overrides: Partial<StatGame>): StatGame => ({
  bggId: 1,
  categories: [],
  favorite: false,
  gifted: false,
  isExpansion: false,
  mechanics: [],
  moneySpent: 0,
  name: "Game",
  weight: null,
  ...overrides,
});

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
      { key: "expert", value: 1 },
    ]);
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
});
