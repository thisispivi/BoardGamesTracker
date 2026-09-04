import { eng, ita, removeStopwords } from "stopword";

const stopwords = [...eng, ...ita];

/**
 * Normalizes multilingual game-search text for fuzzy and remote matching.
 *
 * @param value - A game title or query in any supported language.
 * @returns The normalized search text.
 */
export function normalizeSearchText(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([\p{L}])([\p{N}])/gu, "$1 $2")
    .replace(/([\p{N}])([\p{L}])/gu, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
  if (!normalized) {
    return "";
  }
  const tokens = normalized.split(/\s+/);
  const meaningful = removeStopwords(tokens, stopwords);
  return (meaningful.length > 0 ? meaningful : tokens).join(" ");
}
