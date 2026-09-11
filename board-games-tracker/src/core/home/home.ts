import type { CollectionGame } from "@/core/collection/library.contract";

/** A collection entry together with the moment it was added. */
export type RecentLibraryGame = {
  addedAt: Date;
  game: CollectionGame;
};

/** Everything the signed-in home page shows about one account's library. */
export type HomeSummary = {
  baseGames: number;
  expansions: number;
  favorites: number;
  heaviestGame: CollectionGame | null;
  playedBaseGames: number;
  recentlyAdded: RecentLibraryGame[];
  showcase: CollectionGame[];
  totalSpent: number;
  unplayed: CollectionGame[];
  wishlist: CollectionGame[];
  wishlistGames: number;
};
