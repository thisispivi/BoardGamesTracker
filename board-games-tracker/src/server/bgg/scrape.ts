import "server-only";

import type { BggMetadata } from "@/core";
import { parseBggHtmlPage, parseBggJsonResponses } from "@/server/bgg/parser";
import { readBoundedBody } from "@/utils/readBoundedBody";
import { TtlCache } from "@/utils/ttlCache";

/** Maximum public BGG page size accepted by the scraper. */
const maxHtmlLength = 5_000_000;

/** Maximum public BGG JSON response size accepted by the scraper. */
const maxJsonLength = 2_000_000;

/**
 * Per-game metadata cache.
 *
 * Public pages may throttle repeated requests. Caching keeps one game to one
 * scrape across discovery, the add form, and the save that follows.
 */
const metadataCache = new TtlCache<BggMetadata>(6 * 60 * 60 * 1000, 2_000);

/** Hosts a public BoardGameGeek page may redirect to and still be trusted. */
const bggPageHosts = new Set(["boardgamegeek.com", "www.boardgamegeek.com"]);

/** Request headers presented to BoardGameGeek's public HTML pages. */
const htmlRequestHeaders = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.8",
  "User-Agent": "BoardGamesTracker/0.1 (self-hosted metadata scraper)",
};

/**
 * Fetches a public BoardGameGeek page, following one redirect within the site.
 *
 * BoardGameGeek answers a bare game URL with a redirect to its slugged
 * canonical form, so refusing redirects would leave every page unreachable.
 * The hop is resolved by hand rather than by the fetch API so that only an
 * HTTPS BoardGameGeek target is ever requested; anything else ends the scrape.
 *
 * @param url - HTTPS BoardGameGeek page to load.
 * @param remainingHops - Redirects still allowed before giving up.
 * @returns The final response, or null when the page is not reachable on BoardGameGeek.
 */
async function fetchBggPage(
  url: URL,
  remainingHops: number,
): Promise<Response | null> {
  const response = await fetch(url, {
    headers: htmlRequestHeaders,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  const location = response.headers.get("location");
  if (response.status < 300 || response.status > 399 || !location) {
    return response;
  }

  await response.body?.cancel();
  const target = URL.parse(location, url);
  if (
    remainingHops === 0 ||
    !target ||
    target.protocol !== "https:" ||
    !bggPageHosts.has(target.hostname)
  ) {
    return null;
  }
  return fetchBggPage(target, remainingHops - 1);
}

/**
 * Scrapes metadata embedded in one public BoardGameGeek game page.
 *
 * @param bggId - The validated BoardGameGeek identifier.
 * @returns Normalized public metadata, or null when the page is unavailable.
 */
async function scrapeHtmlPage(bggId: number): Promise<BggMetadata | null> {
  const response = await fetchBggPage(
    new URL(`https://boardgamegeek.com/boardgame/${bggId}`),
    1,
  );
  if (
    !response?.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    return null;
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > maxHtmlLength) return null;
  return parseBggHtmlPage(
    new TextDecoder().decode(
      await readBoundedBody(response.body, maxHtmlLength),
    ),
    bggId,
  );
}

/**
 * Fetches one bounded JSON response from BGG's public application API.
 *
 * @param url - The allowlisted API URL assembled by the caller.
 * @returns Parsed JSON, or null when the response is invalid or unavailable.
 */
async function fetchBggJson(url: string): Promise<unknown | null> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted metadata scraper)",
    },
    cache: "no-store",
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
  if (contentLength > maxJsonLength) return null;
  const body = new TextDecoder().decode(
    await readBoundedBody(response.body, maxJsonLength),
  );
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Loads one game from BGG's JSON API with the HTML page as a fallback.
 *
 * @param bggId - The validated BoardGameGeek identifier.
 * @returns Normalized public metadata, or null when BGG is unavailable.
 */
async function scrapePage(bggId: number): Promise<BggMetadata | null> {
  const query = `objectid=${bggId}&objecttype=thing`;
  const [itemResponse, dynamicResponse] = await Promise.all([
    fetchBggJson(`https://api.geekdo.com/api/geekitems?${query}`).catch(
      () => null,
    ),
    fetchBggJson(`https://api.geekdo.com/api/dynamicinfo?${query}`).catch(
      () => null,
    ),
  ]);
  return (
    parseBggJsonResponses(itemResponse, dynamicResponse, bggId) ??
    scrapeHtmlPage(bggId)
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
