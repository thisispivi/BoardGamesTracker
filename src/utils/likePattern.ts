/**
 * Escapes LIKE wildcards so user text only ever matches literally.
 *
 * PostgreSQL treats `%` and `_` as wildcards and `\` as their escape, so a
 * search term containing any of them would otherwise match far more rows than
 * the text the user typed.
 *
 * @param value - Untrusted search text.
 * @returns The text with backslash, percent, and underscore escaped for PostgreSQL.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
