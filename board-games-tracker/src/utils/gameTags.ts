import type { CollectionGame, GameTag } from "@/core";
import { getTaxonomyLabel, isExpansionCategory } from "@/utils/gameTaxonomy";

/**
 * Builds the localized taxonomy pills shown for a game.
 *
 * Expansion categories are dropped because the card already says whether an
 * entry is an expansion, and a label that appears as both a category and a
 * mechanic is kept once so the row never repeats itself. Categories lead
 * because they are the coarser, more recognizable label of the two.
 *
 * @param game - Game whose scraped categories and mechanics are summarized.
 * @param locale - Active application locale used for translated labels.
 * @returns Unique pills in display order, categories before mechanics.
 */
export function buildGameTags(game: CollectionGame, locale: string): GameTag[] {
  const categories: GameTag[] = game.categories
    .filter((value) => !isExpansionCategory(value))
    .map((value) => ({
      label: getTaxonomyLabel(value, "category", locale),
      tone: "category",
    }));
  const mechanics: GameTag[] = game.mechanics.map((value) => ({
    label: getTaxonomyLabel(value, "mechanic", locale),
    tone: "mechanic",
  }));

  const unique = new Map<string, GameTag>();
  for (const tag of [...categories, ...mechanics]) {
    if (!unique.has(tag.label)) unique.set(tag.label, tag);
  }

  return [...unique.values()];
}
