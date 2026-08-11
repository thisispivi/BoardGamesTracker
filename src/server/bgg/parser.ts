import type { BggMetadata } from "@/core";
import { hasExpansionCategory } from "@/utils/gameTaxonomy";

/** Maximum public page size accepted by the metadata parser. */
const maxHtmlLength = 5_000_000;

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
      // A malformed optional taxonomy entry must not discard valid metadata.
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
    weight: pageNumber(html, ["averageweight", "averageWeight"], 0, 5),
    yearPublished:
      pageNumber(html, ["yearpublished", "yearPublished"], 1800, 2200) ??
      (titleYear ? Number(titleYear) : null),
  };
}
