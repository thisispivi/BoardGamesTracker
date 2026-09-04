import type { GameWeightBand } from "@/core/collection/collection";

/** Minimum collection shape required for aggregate statistics. */
export type StatGame = {
  bggId: number;
  categories: string[];
  favorite: boolean;
  gifted: boolean;
  isExpansion: boolean;
  mechanics: string[];
  moneySpent: number;
  name: string;
  weight: number | null;
};

/** One labeled count used by category and mechanic charts. */
export type CountDatum = { name: string; value: number };

/** One complexity band and how many rated games fall inside it. */
export type ComplexityDatum = { key: GameWeightBand; value: number };

/** Aggregate insights derived from a user's owned collection. */
export type CollectionStats = {
  averageSpent: number;
  baseGames: number;
  categories: CountDatum[];
  complexity: ComplexityDatum[];
  expansions: number;
  favorites: number;
  mechanics: CountDatum[];
  medianSpent: number;
  mostExpensive: CountDatum[];
  pricedItems: number;
  totalItems: number;
  totalSpent: number;
};
