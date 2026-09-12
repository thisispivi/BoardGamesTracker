import type { GameWeightBand } from "@/core/collection/collection";

/** Minimum collection shape required for aggregate statistics. */
export type StatGame = {
  bggId: number;
  categories: string[];
  favorite: boolean;
  gifted: boolean;
  hasPlayed: boolean;
  isExpansion: boolean;
  maxPlayers: number;
  maxPlaytime: number;
  mechanics: string[];
  minPlayers: number;
  minPlaytime: number;
  moneySpent: number;
  name: string;
  weight: number | null;
  yearPublished: number | null;
};

/** One labeled count used by category and mechanic charts. */
export type CountDatum = { name: string; value: number };

/** One complexity band and how many rated games fall inside it. */
export type ComplexityDatum = { key: GameWeightBand; value: number };

/** Session-length bands in ascending duration order. */
export type PlaytimeBand = "quick" | "short" | "medium" | "long";

/** One session-length band and how many games declare a fitting duration. */
export type PlaytimeDatum = { key: PlaytimeBand; value: number };

/** How many base games can be played at one exact table size. */
export type PlayerCountDatum = { players: number; value: number };

/** How many base games were first published in one decade. */
export type DecadeDatum = { decade: number; value: number };

/** Spend brackets for a priced game, from cheapest to dearest. */
export type PriceBand = "upTo25" | "upTo50" | "upTo100" | "over100";

/**
 * Upper bound of each spend bracket in the user's own currency.
 *
 * The brackets are deliberately currency-blind: they describe what the user
 * recorded, whatever that currency is, and the dearest one is open-ended.
 */
export const priceBandBounds: Record<PriceBand, number | null> = {
  upTo25: 25,
  upTo50: 50,
  upTo100: 100,
  over100: null,
};

/** One spend bracket and how many priced games fall inside it. */
export type PriceBandDatum = { key: PriceBand; value: number };

/** Aggregate insights derived from a user's owned collection. */
export type CollectionStats = {
  averagePlaytime: number | null;
  averageSpent: number;
  averageWeight: number | null;
  baseGames: number;
  categories: CountDatum[];
  complexity: ComplexityDatum[];
  decades: DecadeDatum[];
  easiestGames: CountDatum[];
  expansions: number;
  favorites: number;
  hardestGames: CountDatum[];
  mechanics: CountDatum[];
  medianSpent: number;
  mostExpensive: CountDatum[];
  playedBaseGames: number;
  playerCounts: PlayerCountDatum[];
  playtime: PlaytimeDatum[];
  prices: PriceBandDatum[];
  pricedItems: number;
  totalItems: number;
  totalSpent: number;
};
