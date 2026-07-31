import "server-only";

import type { BggMetadata } from "@/core";
import { parseBggGeekItemPayload } from "@/server/bgg/parser";
import { hasExpansionCategory } from "@/utils/gameTaxonomy";
import { TtlCache } from "@/utils/ttlCache";

export type { BggMetadata } from "@/core";

/**
 * Per-game metadata cache.
 *
 * BoardGameGeek throttles a client that asks repeatedly, and a throttled reply
 * is indistinguishable from a game with no data, which silently writes default
 * player counts and play times. Caching keeps one game to one request across a
 * search, the add form, and the save that follows.
 */
const metadataCache = new TtlCache<BggMetadata>(6 * 60 * 60 * 1000, 2_000);

/**
 * Decodes the small HTML entity subset used in metadata attributes.
 *
 * @param value - The value to inspect or transform.
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
 * Returns the first bounded finite number matched in public page data.
 *
 * @param html - The 'html' value.
 * @param keys - The 'keys' value.
 * @param minimum - The 'minimum' value.
 * @param maximum - The 'maximum' value.
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
 * @param html - The 'html' value.
 * @param property - The 'property' value.
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
 * Extracts unique labels from embedded public BGG taxonomy objects.
 *
 * @param html - The 'html' value.
 * @param type - The 'type' value.
 */
function taxonomy(html: string, type: string): string[] {
  const normalized = decodeHtml(html);
  const values = new Set<string>();
  const patterns = [
    new RegExp(
      `"type"\\s*:\\s*"${type}"[\\s\\S]{0,180}?"value"\\s*:\\s*"((?:\\\\.|[^"\\\\])+)"`,
      "gi",
    ),
    new RegExp(
      `"value"\\s*:\\s*"((?:\\\\.|[^"\\\\])+)"[\\s\\S]{0,180}?"type"\\s*:\\s*"${type}"`,
      "gi",
    ),
  ];
  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      if (!match[1]) continue;
      try {
        const value = JSON.parse(`"${match[1]}"`) as string;
        if (value.trim()) values.add(value.trim());
      } catch {
        // Ignore malformed embedded values; the whole scrape remains optional.
      }
    }
  }
  return [...values].slice(0, 50);
}

/**
 * Accepts only artwork from BGG's public image CDN.
 *
 * @param value - The value to inspect or transform.
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
 * Reads the structured data backing one public BGG credits page.
 *
 * @param bggId - The BoardGameGeek identifier.
 */
async function scrapeCredits(bggId: number): Promise<BggMetadata | null> {
  const url = new URL("https://boardgamegeek.com/api/geekitems");
  url.searchParams.set("objectid", String(bggId));
  url.searchParams.set("objecttype", "thing");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Referer: `https://boardgamegeek.com/boardgame/${bggId}/credits`,
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted collection metadata)",
    },
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return null;
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 5_000_000) return null;
  const body = (await response.text()).slice(0, 5_000_000);
  return parseBggGeekItemPayload(JSON.parse(body) as unknown, bggId);
}

/**
 * Falls back to metadata embedded in one public BGG game page.
 *
 * @param bggId - The BoardGameGeek identifier.
 */
async function scrapeHtmlPage(bggId: number): Promise<BggMetadata | null> {
  const response = await fetch(`https://boardgamegeek.com/boardgame/${bggId}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted collection metadata)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    return null;
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 5_000_000) return null;
  const html = (await response.text()).slice(0, 5_000_000);
  if (/cf-chl-|Just a moment|Enable JavaScript and cookies/i.test(html)) {
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
  return {
    bggId,
    bggRating: pageNumber(html, ["average", "averageRating"], 0, 10),
    categories,
    description: description.replaceAll(/\s+/g, " ").slice(0, 10_000),
    families: taxonomy(html, "boardgamefamily"),
    imageUrl: trustedImage(metaContent(html, "og:image")),
    isExpansion: hasExpansionCategory(categories),
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

/**
 * Scrapes one game's credits data, with public HTML as a soft fallback.
 *
 * @param bggId - The BoardGameGeek identifier.
 */
async function scrapePage(bggId: number): Promise<BggMetadata | null> {
  return (
    (await scrapeCredits(bggId).catch(() => null)) ??
    scrapeHtmlPage(bggId).catch(() => null)
  );
}

/**
 * Best-effort, low-concurrency scrape of public BGG pages with soft failure.
 *
 * @param ids - The 'ids' value.
 * @returns The documented function result.
 */
export async function scrapeBggMetadata(
  ids: number[],
): Promise<Map<number, BggMetadata>> {
  const uniqueIds = [...new Set(ids)]
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 2_000);
  const metadata = new Map<number, BggMetadata>();
  const pending: number[] = [];
  for (const id of uniqueIds) {
    const cached = metadataCache.get(String(id));
    if (cached) {
      metadata.set(id, cached);
    } else {
      pending.push(id);
    }
  }

  for (let index = 0; index < pending.length; index += 4) {
    const batch = pending.slice(index, index + 4);
    const results = await Promise.all(
      batch.map((id) => scrapePage(id).catch(() => null)),
    );
    for (const result of results) {
      if (result) {
        metadata.set(
          result.bggId,
          metadataCache.set(String(result.bggId), result),
        );
      }
    }
  }
  return metadata;
}
