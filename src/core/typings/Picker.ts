/** Fields needed to filter and choose a game. */
export type PickableGame = {
  gameId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  maxPlaytime: number;
  weight: number | null;
  favorite: boolean;
  imageUrl?: string | null;
  isExpansion: boolean;
  categories?: string[];
  mechanics?: string[];
  families?: string[];
};

/** User-selected constraints for the game picker. */
export type PickerFilters = {
  players: number;
  maxMinutes: number;
  maxWeight: number;
  favoritesOnly: boolean;
  mechanics?: string[];
  themes?: string[];
  excludeExpansions: boolean;
};
