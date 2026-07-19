import type { BggMetadata } from "@/core";
import { hasExpansionCategory } from "@/utils/gameTaxonomy";

type UnknownRecord = Record<string, unknown>;

/**
 * Narrows untrusted JSON values to plain records.
 *
 * @param value - The value to inspect or transform.
 */
function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

/**
 * Reads a bounded number from BGG's string-or-number fields.
 *
 * @param value - The value to inspect or transform.
 * @param minimum - The 'minimum' value.
 * @param maximum - The 'maximum' value.
 */
function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

/**
 * Extracts unique approved names from one BGG credits link group.
 *
 * @param links - The 'links' value.
 * @param key - The 'key' value.
 */
function linkNames(links: UnknownRecord, key: string): string[] {
  const entries = Array.isArray(links[key]) ? links[key] : [];
  const names = new Set<string>();
  for (const entry of entries) {
    const value = record(entry)?.name;
    if (typeof value === "string" && value.trim()) {
      names.add(value.trim().slice(0, 160));
    }
  }
  return [...names].slice(0, 50);
}

/**
 * Converts BGG description markup to bounded plain text.
 *
 * @param value - The value to inspect or transform.
 */
function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replaceAll(/<br\s*\/?>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll(/\s+/g, " ")
    .trim()
    .slice(0, 10_000);
}

/**
 * Accepts only artwork hosted on BGG's HTTPS image CDN.
 *
 * @param value - The value to inspect or transform.
 */
function trustedImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "cf.geekdo-images.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Parses the structured payload backing a public BGG game's credits page.
 *
 * @param payload - The 'payload' value.
 * @param expectedBggId - The 'expectedBggId' value.
 * @returns The documented function result.
 */
export function parseBggGeekItemPayload(
  payload: unknown,
  expectedBggId: number,
): BggMetadata | null {
  const item = record(record(payload)?.item);
  if (!item) return null;
  if (
    boundedNumber(item.objectid, 1, Number.MAX_SAFE_INTEGER) !== expectedBggId
  ) {
    return null;
  }
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name) return null;

  const links = record(item.links) ?? {};
  const categories = linkNames(links, "boardgamecategory");
  const images = record(item.images) ?? {};
  const subtypes = Array.isArray(item.subtypes) ? item.subtypes : [];
  const minPlayers = boundedNumber(item.minplayers, 1, 99) ?? 1;
  const minPlaytime = boundedNumber(item.minplaytime, 0, 10_000) ?? 0;

  return {
    bggId: expectedBggId,
    bggRating: null,
    categories,
    description: plainText(item.description),
    families: linkNames(links, "boardgamefamily"),
    imageUrl: trustedImage(images.original) ?? trustedImage(item.imageurl),
    isExpansion:
      item.subtype === "boardgameexpansion" ||
      subtypes.includes("boardgameexpansion") ||
      hasExpansionCategory(categories),
    maxPlayers: boundedNumber(item.maxplayers, minPlayers, 99) ?? minPlayers,
    maxPlaytime:
      boundedNumber(item.maxplaytime, minPlaytime, 10_000) ?? minPlaytime,
    mechanics: linkNames(links, "boardgamemechanic"),
    minPlayers,
    minPlaytime,
    name: name.slice(0, 160),
    weight: null,
    yearPublished: boundedNumber(item.yearpublished, 1800, 2200),
  };
}
