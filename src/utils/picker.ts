import type { PickableGame, PickerFilters } from "@/core";

/**
 * Returns games satisfying every active game-night constraint.
 *
 * @param games - The candidate games.
 * @param filters - The active picker filters.
 * @returns The games that satisfy every active picker constraint.
 */
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
    const mechanics = new Set(
      (filters.mechanics ?? []).map((value) => value.toLocaleLowerCase()),
    );
    const themes = new Set(
      (filters.themes ?? []).map((value) => value.toLocaleLowerCase()),
    );
    const fitsMechanics =
      mechanics.size === 0 ||
      (game.mechanics ?? []).some((value) =>
        mechanics.has(value.toLocaleLowerCase()),
      );
    const fitsThemes =
      themes.size === 0 ||
      [...(game.categories ?? []), ...(game.families ?? [])].some((value) =>
        themes.has(value.toLocaleLowerCase()),
      );
    const fitsExpansion = !filters.excludeExpansions || !game.isExpansion;
    return (
      supportsPlayers &&
      fitsDuration &&
      fitsWeight &&
      fitsFavorites &&
      fitsMechanics &&
      fitsThemes &&
      fitsExpansion
    );
  });
}

/**
 * Chooses an unbiased random game from the filtered candidate set.
 *
 * @param games - The candidate games.
 * @param filters - The active picker filters.
 * @param random - Injectable random source used to make selection testable.
 * @returns A randomly selected eligible game, or null when none qualify.
 */
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
