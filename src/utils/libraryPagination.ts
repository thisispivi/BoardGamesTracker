/** Progressive portions of two ordered library sections. */
export type LibraryPage<Primary, Secondary> = {
  primary: Primary[];
  secondary: Secondary[];
  shown: number;
  total: number;
};

/**
 * Applies one display budget across two ordered library sections.
 *
 * @param primary - Entries displayed before the secondary section.
 * @param secondary - Entries that use any budget left by the primary section.
 * @param limit - Maximum top-level entries to return across both sections.
 * @returns Visible section slices with rendered and available totals.
 */
export function paginateLibraryEntries<Primary, Secondary>(
  primary: Primary[],
  secondary: Secondary[],
  limit: number,
): LibraryPage<Primary, Secondary> {
  const boundedLimit = Math.max(0, Math.trunc(limit));
  const visiblePrimary = primary.slice(0, boundedLimit);
  const remaining = Math.max(0, boundedLimit - visiblePrimary.length);
  const visibleSecondary = secondary.slice(0, remaining);
  return {
    primary: visiblePrimary,
    secondary: visibleSecondary,
    shown: visiblePrimary.length + visibleSecondary.length,
    total: primary.length + secondary.length,
  };
}
