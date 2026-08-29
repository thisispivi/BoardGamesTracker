import Fuse from "fuse.js";

import type { CollectionGame } from "@/core";
import { normalizeSearchText } from "@/utils/search";

/** A base game and the owned expansions displayed beneath it. */
type CollectionGroup = {
  base: CollectionGame;
  expansions: CollectionGame[];
};

/** Collection groups and expansions without an owned, resolvable parent. */
type GroupedCollection = {
  groups: CollectionGroup[];
  ungrouped: CollectionGame[];
};

/**
 * Measures shared normalized title tokens for cautious expansion matching.
 *
 * @param left - First collection group in the comparison.
 * @param right - Second collection group in the comparison.
 * @returns The proportion of normalized search tokens shared by both names.
 */
function tokenOverlap(left: string, right: string): number {
  const leftTokens = new Set(left.split(" "));
  const rightTokens = new Set(right.split(" "));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token));
  return (
    shared.length / Math.max(1, Math.min(leftTokens.size, rightTokens.size))
  );
}

/**
 * Associates expansions with an owned base game using BGG links before title matching.
 *
 * @param games - The candidate games.
 * @returns Base-game groups and collection entries without a resolvable parent.
 */
export function groupCollection(games: CollectionGame[]): GroupedCollection {
  const baseGames = games.filter((game) => !game.isExpansion);
  const expansions = games.filter((game) => game.isExpansion);
  const baseGamesByBggId = new Map(baseGames.map((game) => [game.bggId, game]));
  const searchableBases = baseGames.map((game) => ({
    game,
    normalizedName: normalizeSearchText(game.name),
  }));
  const fuzzyBases = new Fuse(searchableBases, {
    keys: ["normalizedName"],
    threshold: 0.58,
    ignoreLocation: true,
    includeScore: true,
  });
  const expansionMap = new Map<string, CollectionGame[]>();
  const ungrouped: CollectionGame[] = [];

  for (const expansion of expansions) {
    const linkedParent = expansion.expandsBggIds
      .map((bggId) => baseGamesByBggId.get(bggId))
      .find((game) => game !== undefined);
    const linkedFromBase = baseGames.find((base) =>
      base.expansionBggIds.includes(expansion.bggId),
    );
    const expansionName = normalizeSearchText(expansion.name);
    const direct = searchableBases
      .filter(({ normalizedName }) =>
        expansionName.startsWith(`${normalizedName} `),
      )
      .sort(
        (left, right) =>
          right.normalizedName.length - left.normalizedName.length,
      )[0];
    const fuzzy = fuzzyBases
      .search(expansionName, { limit: 3 })
      .find(
        (result) =>
          tokenOverlap(expansionName, result.item.normalizedName) >= 0.5,
      )?.item;
    const base = linkedParent ?? linkedFromBase ?? direct?.game ?? fuzzy?.game;
    if (!base) {
      ungrouped.push(expansion);
      continue;
    }
    const grouped = expansionMap.get(base.id) ?? [];
    grouped.push(expansion);
    expansionMap.set(base.id, grouped);
  }

  return {
    groups: baseGames.map((base) => ({
      base,
      expansions: (expansionMap.get(base.id) ?? []).sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    })),
    ungrouped,
  };
}
