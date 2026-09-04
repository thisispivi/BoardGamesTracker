/** Serialized collection game rendered by the browser. */
export type CollectionGame = {
  id: string;
  favorite: boolean;
  personalRating: number | null;
  notes: string;
  moneySpent: number;
  gifted: boolean;
  gameId: string;
  bggId: number;
  name: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  minPlaytime: number;
  maxPlaytime: number;
  weight: number | null;
  bggRating: number | null;
  isExpansion: boolean;
  expandsBggIds: number[];
  expansionBggIds: number[];
  categories: string[];
  mechanics: string[];
  families: string[];
};

/** Game kinds available to the shared library browser. */
export type LibraryGameType = "all" | "baseGames" | "expansions";

/** Complexity bands available to the shared library browser. */
export type LibraryWeightFilter =
  "all" | "light" | "medium" | "heavy" | "veryHeavy";

/** Stable ordering choices available to the shared library browser. */
export type LibrarySort =
  | "nameAscending"
  | "nameDescending"
  | "weightAscending"
  | "weightDescending"
  | "timeAscending"
  | "timeDescending";

/** Search, facet, and ordering state shared by collection and wishlist views. */
export type LibraryFilters = {
  categories: string[];
  favoritesOnly: boolean;
  gameType: LibraryGameType;
  maxPlaytime: number | null;
  mechanics: string[];
  players: number | null;
  query: string;
  sort: LibrarySort;
  weight: LibraryWeightFilter;
};

/** Serializable result returned by collection mutations. */
export type CollectionActionState = {
  success: boolean;
  message: string;
};
