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
 * @param value - The value to inspect or transform.
 * @param taxonomy - The 'taxonomy' value.
 * @param locale - The 'locale' value.
 * @returns The documented function result.
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
 * @param category - The 'category' value.
 * @returns The documented function result.
 */
export function isExpansionCategory(category: string): boolean {
  return expansionCategories.has(category.trim().toLocaleLowerCase("en"));
}

/**
 * Infers expansion status when BGG subtype metadata is unavailable.
 *
 * @param categories - The 'categories' value.
 * @returns The documented function result.
 */
export function hasExpansionCategory(categories: readonly string[]): boolean {
  return categories.some(isExpansionCategory);
}
