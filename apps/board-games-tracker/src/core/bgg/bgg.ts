/** Normalized owned game read from an official BGG collection export. */
export type ImportedBggGame = {
  bggId: number;
  bggRating: number | null;
  categories: string[];
  hasPlayed: boolean;
  isExpansion: boolean;
  maxPlayers: number;
  maxPlaytime: number;
  minPlayers: number;
  minPlaytime: number;
  name: string;
  notes: string;
  personalRating: number | null;
  weight: number | null;
  yearPublished: number | null;
};

/** Result summary for a validated BGG collection CSV. */
export type BggCsvImport = {
  games: ImportedBggGame[];
  invalid: number;
  skipped: number;
};

/** Validated BGG artwork ready for content-addressed persistence. */
export type StoredGameImage = {
  checksum: string;
  data: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  size: number;
  sourceUrl: string;
};
