import "server-only";

import type { GameDiscoveryResult } from "@/core";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import {
  type DiscoveredGame,
  searchBggGames,
} from "@/server/discovery/bggSearch";
import {
  discoverBoardGameImages,
  searchViaSearxng,
} from "@/server/discovery/searxng";
import { createSelectionToken } from "@/server/discovery/selectionToken";
import { normalizeSearchText } from "@/utils/search";
import { TtlCache } from "@/utils/ttlCache";

/**
 * Cached unsigned results keyed by normalized query.
 *
 * Selection tokens are excluded and re-signed on read, so a cache hit never
 * hands out a token closer to expiry than a miss.
 */
const searchCache = new TtlCache<DiscoveredGame[]>(10 * 60_000, 300);

/** How long BoardGameGeek search is skipped after it refuses a request. */
const bggCooldownMs = 5 * 60_000;

let bggUnavailableUntil = 0;

/**
 * Finds candidates on BoardGameGeek, falling back to metasearch when it fails.
 *
 * BoardGameGeek sits behind bot protection that answers a challenge instead of
 * results once a client asks too often, and it keeps refusing for a while.
 * Retrying on every keystroke would only extend that, so a refusal parks the
 * BoardGameGeek path for a cooldown and searches go straight to metasearch.
 *
 * @param normalizedQuery - The normalized, non-empty search term.
 * @returns The unenriched candidates from whichever source answered.
 */
async function findCandidates(
  normalizedQuery: string,
): Promise<DiscoveredGame[]> {
  if (Date.now() >= bggUnavailableUntil) {
    const fromBgg = await searchBggGames(normalizedQuery).catch(() => {
      bggUnavailableUntil = Date.now() + bggCooldownMs;
      return [];
    });
    if (fromBgg.length > 0) {
      return fromBgg;
    }
  }
  return searchViaSearxng(normalizedQuery);
}

/**
 * Enriches candidates with BoardGameGeek artwork, years, and expansion status.
 *
 * Artwork comes from BGG itself, so it resolves for any game with a cover.
 * Metasearch is consulted only for the few candidates BGG could not answer for.
 *
 * @param candidates - The unenriched candidates.
 * @returns The enriched games, in their original ranking order.
 */
async function enrichCandidates(
  candidates: DiscoveredGame[],
): Promise<DiscoveredGame[]> {
  if (candidates.length === 0) {
    return [];
  }

  const metadata = await scrapeBggMetadata(
    candidates.map((game) => game.bggId),
  ).catch(() => new Map());
  const enriched = candidates.map((game) => {
    const details = metadata.get(game.bggId);
    return {
      ...game,
      imageUrl: details?.imageUrl ?? game.imageUrl,
      isExpansion: details?.isExpansion ?? game.isExpansion,
      name: details?.name ?? game.name,
      yearPublished: game.yearPublished ?? details?.yearPublished ?? null,
    };
  });

  const missing = enriched.filter((game) => !game.imageUrl);
  if (missing.length === 0) {
    return enriched;
  }

  const fallbackImages = await discoverBoardGameImages(
    missing.map((game) => ({ bggId: game.bggId, name: game.name })),
  ).catch(() => new Map<number, string>());
  return enriched.map((game) => ({
    ...game,
    imageUrl: game.imageUrl ?? fallbackImages.get(game.bggId) ?? null,
  }));
}

/**
 * Reports whether a result set is worth caching.
 *
 * A non-empty result set in which nothing resolved artwork is the signature of
 * a failed or throttled lookup rather than a genuine answer, and caching it
 * would keep serving pictureless results long after the cause cleared.
 *
 * @param games - The freshly discovered games.
 * @returns Whether the results may be stored.
 */
function isCacheable(games: DiscoveredGame[]): boolean {
  return games.length === 0 || games.some((game) => game.imageUrl !== null);
}

/**
 * Searches board games, serving repeated queries from a short-lived cache.
 *
 * @param query - The raw search term.
 * @returns The signed discovery results ready for the client.
 */
export async function searchBoardGames(
  query: string,
): Promise<GameDiscoveryResult[]> {
  const normalized = normalizeSearchText(query);
  const normalizedQuery = normalized === "" ? query.trim() : normalized;
  const cached = searchCache.get(normalizedQuery);
  const games =
    cached ?? (await enrichCandidates(await findCandidates(normalizedQuery)));
  if (!cached && isCacheable(games)) {
    searchCache.set(normalizedQuery, games);
  }

  return games.map((game) => ({
    ...game,
    selectionToken: createSelectionToken({
      bggId: game.bggId,
      imageUrl: game.imageUrl,
      isExpansion: game.isExpansion,
      name: game.name,
      yearPublished: game.yearPublished,
    }),
  }));
}
