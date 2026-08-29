import { z } from "zod";

import type { BggMetadata } from "@/core";
import { hasExpansionCategory } from "@/utils/gameTaxonomy";

/** Maximum public page size accepted by the metadata parser. */
const maxHtmlLength = 5_000_000;

const geekdoLinkSchema = z.object({
  name: z.string().min(1).max(160),
  objectid: z.coerce.number().int().min(1).max(10_000_000).optional(),
});

const geekdoItemResponseSchema = z.object({
  item: z.object({
    imageurl: z.string().max(2_000).nullable().optional(),
    links: z
      .object({
        boardgamecategory: z.array(geekdoLinkSchema).max(200).optional(),
        boardgameexpansion: z.array(geekdoLinkSchema).max(200).optional(),
        boardgamefamily: z.array(geekdoLinkSchema).max(200).optional(),
        boardgamemechanic: z.array(geekdoLinkSchema).max(200).optional(),
        expandsboardgame: z.array(geekdoLinkSchema).max(200).optional(),
      })
      .optional(),
    maxplayers: z.string().max(16).nullable().optional(),
    maxplaytime: z.string().max(16).nullable().optional(),
    minplayers: z.string().max(16).nullable().optional(),
    minplaytime: z.string().max(16).nullable().optional(),
    name: z.string().min(1).max(160),
    objectid: z.number().int().positive(),
    short_description: z.string().max(10_000).nullable().optional(),
    subtypes: z.array(z.string().max(64)).max(20).optional(),
    yearpublished: z.string().max(16).nullable().optional(),
  }),
});

const geekdoDynamicResponseSchema = z.object({
  item: z.object({
    stats: z
      .object({
        average: z.string().max(32).nullable().optional(),
        avgweight: z.string().max(32).nullable().optional(),
      })
      .optional(),
  }),
});

/**
 * Decodes the bounded HTML entity subset used in BGG metadata attributes.
 *
 * @param value - The encoded public-page value.
 * @returns The decoded text.
 */
function decodeHtml(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

/**
 * Returns the first bounded finite number found in embedded page data.
 *
 * @param html - The bounded BGG page markup.
 * @param keys - Alternate public field names to inspect.
 * @param minimum - The smallest accepted value.
 * @param maximum - The largest accepted value.
 * @returns The first valid number, or null.
 */
function pageNumber(
  html: string,
  keys: string[],
  minimum: number,
  maximum: number,
): number | null {
  for (const key of keys) {
    const match = html.match(
      new RegExp(
        `(?:"|&quot;)${key}(?:"|&quot;)\\s*:\\s*(?:\\{\\s*(?:"|&quot;)value(?:"|&quot;)\\s*:\\s*)?(?:"|&quot;)?([0-9.]+)`,
        "i",
      ),
    );
    const value = Number(match?.[1]);
    if (Number.isFinite(value) && value >= minimum && value <= maximum) {
      return value;
    }
  }
  return null;
}

/**
 * Normalizes a bounded numeric field from BGG's JSON response.
 *
 * @param value - The untrusted numeric string.
 * @param minimum - The smallest accepted value.
 * @param maximum - The largest accepted value.
 * @returns The bounded number, or null when absent or invalid.
 */
function jsonNumber(
  value: string | null | undefined,
  minimum: number,
  maximum: number,
): number | null {
  const parsed = Number(value);
  return value !== null &&
    value !== undefined &&
    Number.isFinite(parsed) &&
    parsed >= minimum &&
    parsed <= maximum
    ? parsed
    : null;
}

/**
 * Reads a content attribute from a standard metadata tag.
 *
 * @param html - The bounded BGG page markup.
 * @param property - The metadata property or name.
 * @returns The decoded attribute, or null.
 */
function metaContent(html: string, property: string): string | null {
  const escaped = property.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forward = html.match(
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  );
  const reverse = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
      "i",
    ),
  );
  const value = forward?.[1] ?? reverse?.[1];
  return value ? decodeHtml(value).trim() : null;
}

/**
 * Extracts unique taxonomy labels from embedded public page objects.
 *
 * @param html - The bounded BGG page markup.
 * @param type - The BGG taxonomy type to collect.
 * @returns At most fifty decoded labels.
 */
function taxonomy(html: string, type: string): string[] {
  const normalized = decodeHtml(html);
  const values = new Set<string>();
  for (const match of normalized.matchAll(/\{[^{}]{0,1000}\}/g)) {
    const fragment = match[0];
    if (!new RegExp(`"type"\\s*:\\s*"${type}"`, "i").test(fragment)) {
      continue;
    }
    const rawValue = fragment.match(/"value"\s*:\s*"((?:\\.|[^"\\])+)"/i)?.[1];
    if (!rawValue) continue;
    try {
      const value = JSON.parse(`"${rawValue}"`);
      if (typeof value === "string" && value.trim()) {
        values.add(value.trim().slice(0, 160));
      }
    } catch {
      continue;
    }
  }
  return [...values].slice(0, 50);
}

/**
 * Accepts only artwork from BGG's public HTTPS image CDN.
 *
 * @param value - The untrusted metadata image URL.
 * @returns A canonical trusted URL, or null.
 */
function trustedImage(value: string | null): string | null {
  if (!value) return null;
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
 * Parses BGG's public JSON item and statistics responses.
 *
 * Both payloads are untrusted and validated independently because statistics
 * are optional enrichment while the stable item record is required.
 *
 * @param itemResponse - The parsed public item response.
 * @param dynamicResponse - The parsed public statistics response, when available.
 * @param expectedBggId - The requested BoardGameGeek identifier.
 * @returns Normalized metadata, or null for malformed or unrelated data.
 */
export function parseBggJsonResponses(
  itemResponse: unknown,
  dynamicResponse: unknown,
  expectedBggId: number,
): BggMetadata | null {
  const parsedItem = geekdoItemResponseSchema.safeParse(itemResponse);
  if (!parsedItem.success || parsedItem.data.item.objectid !== expectedBggId) {
    return null;
  }

  const item = parsedItem.data.item;
  const parsedDynamic = geekdoDynamicResponseSchema.safeParse(dynamicResponse);
  const stats = parsedDynamic.success
    ? parsedDynamic.data.item.stats
    : undefined;
  const categories = (item.links?.boardgamecategory ?? [])
    .map((link) => link.name.trim())
    .filter(Boolean)
    .slice(0, 50);
  const minPlayers = jsonNumber(item.minplayers, 1, 99) ?? 1;
  const minPlaytime = jsonNumber(item.minplaytime, 0, 10_000) ?? 0;

  return {
    bggId: expectedBggId,
    bggRating: jsonNumber(stats?.average, 0, 10),
    categories,
    description: decodeHtml(item.short_description ?? "")
      .replaceAll(/\s+/g, " ")
      .trim()
      .slice(0, 10_000),
    expandsBggIds: [
      ...new Set(
        (item.links?.expandsboardgame ?? []).flatMap((link) =>
          link.objectid === undefined ? [] : [link.objectid],
        ),
      ),
    ],
    expansionBggIds: [
      ...new Set(
        (item.links?.boardgameexpansion ?? []).flatMap((link) =>
          link.objectid === undefined ? [] : [link.objectid],
        ),
      ),
    ],
    families: (item.links?.boardgamefamily ?? [])
      .map((link) => link.name.trim())
      .filter(Boolean)
      .slice(0, 50),
    imageUrl: trustedImage(item.imageurl ?? null),
    isExpansion:
      (item.subtypes ?? []).some((subtype) =>
        ["boardgameaccessory", "boardgameexpansion"].includes(subtype),
      ) || hasExpansionCategory(categories),
    maxPlayers: jsonNumber(item.maxplayers, minPlayers, 99) ?? minPlayers,
    maxPlaytime:
      jsonNumber(item.maxplaytime, minPlaytime, 10_000) ?? minPlaytime,
    mechanics: (item.links?.boardgamemechanic ?? [])
      .map((link) => link.name.trim())
      .filter(Boolean)
      .slice(0, 50),
    minPlayers,
    minPlaytime,
    name: item.name.trim(),
    weight: jsonNumber(stats?.avgweight, 1, 5),
    yearPublished: jsonNumber(item.yearpublished, 1800, 2200),
  };
}

/**
 * Verifies that optional canonical metadata belongs to the requested game.
 *
 * @param html - The bounded BGG page markup.
 * @param expectedBggId - The requested BoardGameGeek identifier.
 * @returns Whether the page identity is absent or matches the request.
 */
function hasExpectedIdentity(html: string, expectedBggId: number): boolean {
  const canonical =
    metaContent(html, "og:url") ??
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical/i)?.[1];
  if (!canonical) return true;
  try {
    const url = new URL(decodeHtml(canonical));
    const identity = url.pathname.match(
      /^\/(?:boardgame|boardgameexpansion|boardgameaccessory|boardgameintegration)\/(\d+)/i,
    );
    return Number(identity?.[1]) === expectedBggId;
  } catch {
    return false;
  }
}

/**
 * Parses metadata embedded in one public BoardGameGeek HTML page.
 *
 * The parser consumes only public markup and never calls a BGG API. Every
 * extracted field remains bounded because the page is an untrusted boundary.
 *
 * @param html - The public game-page HTML.
 * @param expectedBggId - The requested BoardGameGeek identifier.
 * @returns Normalized metadata, or null for blocked or unrelated markup.
 */
export function parseBggHtmlPage(
  html: string,
  expectedBggId: number,
): BggMetadata | null {
  if (
    html.length === 0 ||
    html.length > maxHtmlLength ||
    /cf-chl-|Just a moment|Enable JavaScript and cookies/i.test(html) ||
    !hasExpectedIdentity(html, expectedBggId)
  ) {
    return null;
  }

  const rawTitle = metaContent(html, "og:title");
  const name = rawTitle
    ?.replace(/\s*\((?:18|19|20)\d{2}\).*$/, "")
    .replace(/\s*\|\s*BoardGameGeek.*$/i, "")
    .trim();
  if (!name) return null;

  const titleYear = rawTitle?.match(/\(((?:18|19|20)\d{2})\)/)?.[1];
  const description =
    metaContent(html, "og:description") ??
    metaContent(html, "description") ??
    "";
  const categories = taxonomy(html, "boardgamecategory");
  const canonical = metaContent(html, "og:url") ?? "";
  return {
    bggId: expectedBggId,
    bggRating: pageNumber(html, ["average", "averageRating"], 0, 10),
    categories,
    description: description.replaceAll(/\s+/g, " ").slice(0, 10_000),
    expandsBggIds: [],
    expansionBggIds: [],
    families: taxonomy(html, "boardgamefamily"),
    imageUrl: trustedImage(metaContent(html, "og:image")),
    isExpansion:
      /\/boardgame(?:expansion|accessory)\//i.test(canonical) ||
      /"subtype"\s*:\s*"boardgameexpansion"/i.test(decodeHtml(html)) ||
      hasExpansionCategory(categories),
    maxPlayers: pageNumber(html, ["maxplayers", "maxPlayers"], 1, 99) ?? 1,
    maxPlaytime:
      pageNumber(html, ["maxplaytime", "maxPlaytime"], 0, 10_000) ?? 0,
    mechanics: taxonomy(html, "boardgamemechanic"),
    minPlayers: pageNumber(html, ["minplayers", "minPlayers"], 1, 99) ?? 1,
    minPlaytime:
      pageNumber(html, ["minplaytime", "minPlaytime"], 0, 10_000) ?? 0,
    name: name.slice(0, 160),
    weight: pageNumber(html, ["averageweight", "averageWeight"], 1, 5),
    yearPublished:
      pageNumber(html, ["yearpublished", "yearPublished"], 1800, 2200) ??
      (titleYear ? Number(titleYear) : null),
  };
}
