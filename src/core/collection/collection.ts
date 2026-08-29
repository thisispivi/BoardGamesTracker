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

/** Serializable result returned by collection mutations. */
export type CollectionActionState = {
  success: boolean;
  message: string;
};
