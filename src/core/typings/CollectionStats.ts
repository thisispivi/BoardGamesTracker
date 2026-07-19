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
