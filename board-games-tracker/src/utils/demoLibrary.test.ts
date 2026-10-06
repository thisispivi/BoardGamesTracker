import { describe, expect, it } from "vitest";

import { calculateCollectionStats } from "@/utils/collectionStats";
import { createDemoLibrary, summarizeDemoLibrary } from "@/utils/demoLibrary";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";

describe("demo library", () => {
  it("loads local artwork beneath the Pages prefix and keeps summaries consistent", () => {
    const library = createDemoLibrary("/BoardGamesTracker");
    const summary = summarizeDemoLibrary(library);
    const stats = calculateCollectionStats(library.collection);
    expect(library.collection).toHaveLength(20);
    expect(library.wishlist).toHaveLength(6);
    expect(stats.expansions).toBe(2);
    expect(summary.baseGames).toBe(stats.baseGames);
    expect(summary.totalSpent).toBe(stats.totalSpent);
    expect(summary.playedBaseGames).toBe(stats.playedBaseGames);
    expect(summary.wishlistGames).toBe(library.wishlist.length);
    expect(
      [...library.collection, ...library.wishlist].every(
        (game) =>
          game.imageUrl === `/BoardGamesTracker/demo/games/${game.bggId}.jpg`,
      ),
    ).toBe(true);
  });

  it("filters the example account without a server and returns independent fixtures", () => {
    const library = createDemoLibrary();
    const matches = filterAndSortLibraryGames(
      library.collection,
      { ...createLibraryFilters(), query: "Wingspan" },
      "en",
    );
    expect(matches.map((game) => game.name)).toContain("Wingspan");
    expect(
      filterAndSortLibraryGames(
        library.collection,
        { ...createLibraryFilters(), query: "zzqxvnonexistenttitle" },
        "en",
      ),
    ).toEqual([]);
    const original = createDemoLibrary();
    const firstGame = library.collection[0];
    if (!firstGame) throw new Error("Example library is empty.");
    firstGame.name = "Changed locally";
    expect(original.collection[0]?.name).toBe("Wingspan");
  });
});
