/** Fields needed to filter and choose a game. */
export type PickableGame = {
  gameId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  maxPlaytime: number;
  weight: number | null;
  favorite: boolean;
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
  taxonomy?: string;
};

/** Returns games satisfying every active game-night constraint. */
export function filterGames(
  games: PickableGame[],
  filters: PickerFilters,
): PickableGame[] {
  return games.filter((game) => {
    const supportsPlayers =
      game.minPlayers <= filters.players && game.maxPlayers >= filters.players;
    const fitsDuration =
      filters.maxMinutes === 0 || game.maxPlaytime <= filters.maxMinutes;
    const fitsWeight =
      filters.maxWeight === 0 || (game.weight ?? 0) <= filters.maxWeight;
    const fitsFavorites = !filters.favoritesOnly || game.favorite;
    const taxonomy = filters.taxonomy?.toLocaleLowerCase();
    const fitsTaxonomy =
      !taxonomy ||
      [
        ...(game.categories ?? []),
        ...(game.mechanics ?? []),
        ...(game.families ?? []),
      ].some((value) => value.toLocaleLowerCase() === taxonomy);
    return (
      supportsPlayers &&
      fitsDuration &&
      fitsWeight &&
      fitsFavorites &&
      fitsTaxonomy
    );
  });
}

/** Chooses an unbiased random game from the filtered candidate set. */
export function pickRandomGame(
  games: PickableGame[],
  filters: PickerFilters,
  random: () => number = Math.random,
): PickableGame | null {
  const candidates = filterGames(games, filters);
  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(random() * candidates.length)] ?? null;
}
