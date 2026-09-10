import type { CollectionGame, LibraryPage, LibraryPageQuery } from "@/core";
import { libraryPageSize } from "@/core";
import { groupCollection } from "@/utils/collectionGrouping";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";

/**
 * Creates the query for the page every library browser opens on.
 *
 * @returns Default filters with the first window of entries.
 */
export function createFirstPageQuery(): LibraryPageQuery {
  return { filters: createLibraryFilters(), limit: libraryPageSize, offset: 0 };
}

/**
 * Turns grouped games into ordered page entries.
 *
 * @param games - Filtered and sorted games.
 * @returns One entry per base game with its expansions, then one per unmatched expansion.
 */
function groupedEntries(games: CollectionGame[]): CollectionGame[][] {
  const { groups, ungrouped } = groupCollection(games);
  return [
    ...groups.map((group) => [group.base, ...group.expansions]),
    ...ungrouped.map((expansion) => [expansion]),
  ];
}

/**
 * Pages a library already held in memory the way the private endpoint pages the database.
 *
 * With every game type shown, each base game is one entry carrying the matching
 * expansions grouped beneath it, and expansions without a matching parent follow
 * once the base games run out. A game-type filter pages that kind as a flat list.
 *
 * @param games - Complete library to browse, already redacted for its audience.
 * @param query - Filter state and the window of entries to return.
 * @param locale - Active locale used to search and order the games.
 * @returns The window's cards with the counts the endpoint would report.
 */
export function paginateLibraryGames(
  games: CollectionGame[],
  query: LibraryPageQuery,
  locale: string,
): LibraryPage {
  const visible = filterAndSortLibraryGames(games, query.filters, locale);
  const baseGameCount = visible.filter((game) => !game.isExpansion).length;
  const entries =
    query.filters.gameType === "all"
      ? groupedEntries(visible)
      : visible.map((game) => [game]);
  const pageEntries = entries.slice(query.offset, query.offset + query.limit);
  return {
    baseGameCount,
    expansionCount: visible.length - baseGameCount,
    games: pageEntries.flat(),
    nextOffset: query.offset + pageEntries.length,
    total: entries.length,
  };
}
