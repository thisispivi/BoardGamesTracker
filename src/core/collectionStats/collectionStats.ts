import type { GameWeightBand } from "@/core/collection/collection";

/** Minimum collection shape required for aggregate statistics. */
export type StatGame = {
  bggId: number;
  categories: string[];
  favorite: boolean;
  gifted: boolean;
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

/** Aggregate insights derived from a user's owned collection. */
export type CollectionStats = {
  averagePlaytime: number | null;
  averageSpent: number;
  averageWeight: number | null;
  baseGames: number;
  categories: CountDatum[];
  complexity: ComplexityDatum[];
  decades: DecadeDatum[];
  expansions: number;
  favorites: number;
  mechanics: CountDatum[];
  medianSpent: number;
  mostExpensive: CountDatum[];
  playerCounts: PlayerCountDatum[];
  playtime: PlaytimeDatum[];
  pricedItems: number;
  totalItems: number;
  totalSpent: number;
};
