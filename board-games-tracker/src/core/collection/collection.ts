import type {
  CollectionGame,
  LibraryPage,
  LibraryPageQuery,
  LibraryWeightFilter,
} from "@/core/collection/library.contract";

/** One complexity band over BoardGameGeek's inclusive one-to-five weight scale. */
export type GameWeightBand = Exclude<LibraryWeightFilter, "all">;

/** Taxonomy fields required to build complete library facet choices. */
export type LibraryFacetGame = Pick<
  CollectionGame,
  "categories" | "isExpansion" | "mechanics"
>;

/** Loads one window of library results and stops once its signal aborts. */
export type LibraryPageLoader = (
  query: LibraryPageQuery,
  signal: AbortSignal,
) => Promise<LibraryPage>;

/** Serializable result returned by collection mutations. */
export type CollectionActionState = {
  success: boolean;
  message: string;
};
