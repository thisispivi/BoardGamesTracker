import type { GameWeightBand } from "@/core";

/** Band identifiers in ascending complexity order. */
export const gameWeightBands: readonly GameWeightBand[] = [
  "light",
  "medium",
  "heavy",
  "veryHeavy",
];

/**
 * Classifies a BoardGameGeek complexity rating into its band.
 *
 * Each band excludes the upper bound of the band below it, so a rating of
 * exactly 2 is light and 2.1 is medium. An unrated game belongs to no band, and
 * every caller decides for itself how to present that.
 *
 * @param weight - Complexity on the one-to-five scale, or null when unrated.
 * @returns The matching band, or null when the game has no complexity rating.
 */
export function getGameWeightBand(
  weight: number | null,
): GameWeightBand | null {
  if (weight === null) return null;
  if (weight <= 2) return "light";
  if (weight <= 3) return "medium";
  if (weight <= 4) return "heavy";
  return "veryHeavy";
}
