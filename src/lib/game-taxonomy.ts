const expansionCategories = new Set([
  "expansion",
  "expansion for base-game",
  "fan expansion",
  "third-party expansion",
]);

/** Returns whether a BGG category represents an expansion rather than a base game. */
export function isExpansionCategory(category: string): boolean {
  return expansionCategories.has(category.trim().toLocaleLowerCase("en"));
}

/** Infers expansion status when BGG subtype metadata is unavailable. */
export function hasExpansionCategory(categories: readonly string[]): boolean {
  return categories.some(isExpansionCategory);
}
