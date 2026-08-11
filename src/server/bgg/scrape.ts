import "server-only";

import type { BggMetadata } from "@/core";
import { parseBggHtmlPage } from "@/server/bgg/parser";
import { TtlCache } from "@/utils/ttlCache";

export type { BggMetadata } from "@/core";

/** Maximum public BGG page size accepted by the scraper. */
const maxHtmlLength = 5_000_000;

/**
 * Per-game metadata cache.
 *
 * Public pages may throttle repeated requests. Caching keeps one game to one
 * scrape across discovery, the add form, and the save that follows.
 */
const metadataCache = new TtlCache<BggMetadata>(6 * 60 * 60 * 1000, 2_000);

/**
 * Scrapes metadata embedded in one public BoardGameGeek game page.
 *
 * @param bggId - The validated BoardGameGeek identifier.
 * @returns Normalized public metadata, or null when the page is unavailable.
 */
async function scrapePage(bggId: number): Promise<BggMetadata | null> {
  const response = await fetch(`https://boardgamegeek.com/boardgame/${bggId}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.8",
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted metadata scraper)",
    },
    cache: "no-store",
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
  if (contentLength > maxHtmlLength) return null;
  return parseBggHtmlPage(
    (await response.text()).slice(0, maxHtmlLength + 1),
    bggId,
  );
}

/**
 * Performs a best-effort, low-concurrency scrape of public BGG pages.
 *
 * @param ids - BoardGameGeek identifiers needing metadata.
 * @returns The successfully scraped metadata keyed by identifier.
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
