/** Serialized shared game row rendered by the administrator console. */
export type AdminGame = {
  bggId: number;
  bggRating: number | null;
  categories: string[];
  description: string;
  families: string[];
  id: string;
  imageUrl: string | null;
  isExpansion: boolean;
  maxPlayers: number;
  maxPlaytime: number;
  mechanics: string[];
  minPlayers: number;
  minPlaytime: number;
  name: string;
  owners: number;
  yearPublished: number | null;
  weight: number | null;
};

/** One bounded page of shared game records rendered by the administrator console. */
export type AdminGamesPage = {
  games: AdminGame[];
  page: number;
  pages: number;
};

/** Outcome of refreshing one batch of the shared catalog from BoardGameGeek. */
export type CatalogRefreshBatch = {
  failed: number;
  nextCursor: string | null;
  refreshed: number;
  total: number;
};
