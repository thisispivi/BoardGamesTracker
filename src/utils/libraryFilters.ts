import Fuse from "fuse.js";

import type {
  CollectionGame,
  LibraryFilters,
  LibraryWeightFilter,
} from "@/core";
import { normalizeSearchText } from "@/utils/search";

/**
 * Creates an independent default state for a library browser.
 *
 * @returns Filters that show every game in ascending name order.
 */
export function createLibraryFilters(): LibraryFilters {
  return {
    categories: [],
    favoritesOnly: false,
    gameType: "all",
    maxPlaytime: null,
    mechanics: [],
    players: null,
    query: "",
    sort: "nameAscending",
    weight: "all",
  };
}

/**
 * Checks whether a known complexity belongs to the requested BGG weight band.
 *
 * @param weight - BGG complexity on its inclusive one-to-five scale, or null when unrated.
 * @param filter - Complexity band selected by the user.
 * @returns Whether the game belongs in the selected band.
 */
function matchesWeight(
  weight: number | null,
  filter: LibraryWeightFilter,
): boolean {
  if (filter === "all") return true;
  if (weight === null) return false;
  if (filter === "light") return weight <= 2;
  if (filter === "medium") return weight > 2 && weight <= 3;
  if (filter === "heavy") return weight > 3 && weight <= 4;
  return weight > 4;
}

/**
 * Compares nullable metrics while keeping unrated games after known values.
 *
 * @param left - First metric, or null when unavailable.
 * @param right - Second metric, or null when unavailable.
 * @param direction - Sort multiplier where one is ascending and negative one is descending.
 * @returns A comparator result that places null values last in either direction.
 */
function compareNullableMetric(
  left: number | null,
  right: number | null,
  direction: 1 | -1,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return (left - right) * direction;
}

/**
 * Filters and sorts games for either personal library location.
 *
 * @param games - Collection or wishlist records available to browse.
 * @param filters - Current search, facet, and ordering choices.
 * @param locale - Active locale used to order equal and name-sorted games.
 * @returns A new array containing only matching games in the requested order.
 */
export function filterAndSortLibraryGames(
  games: CollectionGame[],
  filters: LibraryFilters,
  locale: string,
): CollectionGame[] {
  const filtered = games.filter(
    (game) =>
      (!filters.favoritesOnly || game.favorite) &&
      (filters.gameType === "all" ||
        (filters.gameType === "expansions") === game.isExpansion) &&
      (filters.players === null ||
        (game.minPlayers <= filters.players &&
          game.maxPlayers >= filters.players)) &&
      (filters.maxPlaytime === null ||
        (game.maxPlaytime > 0 && game.maxPlaytime <= filters.maxPlaytime)) &&
      matchesWeight(game.weight, filters.weight) &&
      (filters.categories.length === 0 ||
        filters.categories.some((category) =>
          game.categories.includes(category),
        )) &&
      (filters.mechanics.length === 0 ||
        filters.mechanics.some((mechanic) =>
          game.mechanics.includes(mechanic),
        )),
  );
  const term = normalizeSearchText(filters.query);
  const searched = term
    ? new Fuse(filtered, {
        keys: [
          { name: "name", weight: 0.8 },
          { name: "categories", weight: 0.25 },
          { name: "mechanics", weight: 0.35 },
          { name: "families", weight: 0.15 },
        ],
        threshold: 0.42,
        ignoreLocation: true,
        useTokenSearch: true,
      })
        .search(term)
        .map((result) => result.item)
    : filtered;

  return searched.toSorted((left, right) => {
    const nameOrder = left.name.localeCompare(right.name, locale);
    if (filters.sort === "nameAscending") return nameOrder;
    if (filters.sort === "nameDescending") return -nameOrder;
    if (filters.sort === "weightAscending") {
      return compareNullableMetric(left.weight, right.weight, 1) || nameOrder;
    }
    if (filters.sort === "weightDescending") {
      return compareNullableMetric(left.weight, right.weight, -1) || nameOrder;
    }
    if (filters.sort === "timeAscending") {
      return (
        compareNullableMetric(
          left.maxPlaytime > 0 ? left.maxPlaytime : null,
          right.maxPlaytime > 0 ? right.maxPlaytime : null,
          1,
        ) || nameOrder
      );
    }
    return (
      compareNullableMetric(
        left.maxPlaytime > 0 ? left.maxPlaytime : null,
        right.maxPlaytime > 0 ? right.maxPlaytime : null,
        -1,
      ) || nameOrder
    );
  });
}
