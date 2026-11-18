import type { DemoLibrary, HomeSummary } from "@/core";
import { demoLibrarySchema } from "@/core";
import exampleLibrary from "@/core/demo/library.json";
import { calculateCollectionStats } from "@/utils/collectionStats";

/** Fixed clock that keeps the fictional account's relative dates reproducible. */
export const demoNow = new Date("2026-10-06T12:00:00Z");

/**
 * Loads the fictional library with artwork served beneath the demo's base path.
 *
 * @param basePath - Deployment prefix, empty locally or the GitHub repository path.
 * @returns Validated collection and wishlist cards containing only fictional account data.
 */
export function createDemoLibrary(basePath = ""): DemoLibrary {
  const library = demoLibrarySchema.parse(exampleLibrary);
  for (const game of [...library.collection, ...library.wishlist]) {
    game.imageUrl = `${basePath}/demo/games/${game.bggId}.jpg`;
    game.thumbnailUrl = game.imageUrl;
  }
  return library;
}

/**
 * Computes the dashboard from the same fictional library used by the other pages.
 *
 * @param library - Validated example collection and wishlist.
 * @returns Counts, covers, and sample addition times consistent with the library.
 */
export function summarizeDemoLibrary(library: DemoLibrary): HomeSummary {
  const stats = calculateCollectionStats(library.collection);
  const baseGames = library.collection.filter((game) => !game.isExpansion);
  return {
    baseGames: stats.baseGames,
    expansions: stats.expansions,
    favorites: library.collection.filter((game) => game.favorite).length,
    heaviestGame:
      baseGames.toSorted(
        (left, right) => (right.weight ?? 0) - (left.weight ?? 0),
      )[0] ?? null,
    playedBaseGames: stats.playedBaseGames,
    recentlyAdded: library.collection.slice(0, 5).map((game, index) => ({
      addedAt: new Date(demoNow.getTime() - (index + 1) * 86_400_000),
      game,
    })),
    showcase: baseGames.slice(0, 5),
    totalSpent: stats.totalSpent,
    unplayed: baseGames.filter((game) => !game.hasPlayed),
    wishlist: library.wishlist.slice(0, 4),
    wishlistGames: library.wishlist.length,
  };
}
