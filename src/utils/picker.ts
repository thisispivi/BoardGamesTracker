import type { CollectionGame } from "@/core";

/**
 * Chooses an unbiased random game from an already filtered candidate set.
 *
 * @param candidates - Games that satisfy the active filters.
 * @param random - Injectable random source used to make selection testable.
 * @returns A randomly selected candidate, or null when the set is empty.
 */
export function pickRandomGame(
  candidates: CollectionGame[],
  random: () => number = Math.random,
): CollectionGame | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(random() * candidates.length)] ?? null;
}
