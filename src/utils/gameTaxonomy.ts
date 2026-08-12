import taxonomy from "@/i18n/taxonomy/it.json";

/** BoardGameGeek taxonomy labels keyed by their stable English source values. */
const bggCategoryLabels: Readonly<Record<string, string>> = taxonomy.category;
const bggMechanicLabels: Readonly<Record<string, string>> = taxonomy.mechanic;

/** Canonical BoardGameGeek category names. */
export const bggCategories = Object.keys(bggCategoryLabels);

/** Canonical BoardGameGeek mechanic names. */
export const bggMechanics = Object.keys(bggMechanicLabels);

const expansionCategories = new Set([
  "expansion",
  "expansion for base-game",
  "fan expansion",
  "third-party expansion",
]);

/**
 * Returns a localized taxonomy label while preserving unknown imported values.
 *
 * @param value - Untrusted input being validated or normalized.
 * @param taxonomy - Taxonomy namespace used to resolve the translated label.
 * @param locale - Active application locale used for translated labels.
 * @returns The translated label, or the imported source value when unknown.
 */
export function getTaxonomyLabel(
  value: string,
  taxonomy: "category" | "mechanic",
  locale: string,
): string {
  if (!locale.toLocaleLowerCase().startsWith("it")) return value;
  const labels =
    taxonomy === "category" ? bggCategoryLabels : bggMechanicLabels;
  return (labels as Readonly<Record<string, string>>)[value] ?? value;
}

/**
 * Returns whether a BGG category represents an expansion rather than a base game.
 *
 * @param category - BoardGameGeek category to classify.
 * @returns Whether the category identifies an expansion.
 */
export function isExpansionCategory(category: string): boolean {
  return expansionCategories.has(category.trim().toLocaleLowerCase("en"));
}

/**
 * Infers expansion status when BGG subtype metadata is unavailable.
 *
 * @param categories - BoardGameGeek categories associated with the games.
 * @returns Whether any category identifies an expansion.
 */
export function hasExpansionCategory(categories: readonly string[]): boolean {
  return categories.some(isExpansionCategory);
}
