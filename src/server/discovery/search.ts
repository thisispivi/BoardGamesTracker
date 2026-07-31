import "server-only";

import type { DiscoveredGame, GameDiscoveryResult } from "@/core";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
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

/** Time allowed for artwork enrichment before results are sent as they are. */
const enrichmentBudgetMs = 4_000;

/**
 * Resolves a slower enrichment step, or gives up and returns a fallback.
 *
 * Enrichment only decorates results that are already usable, so a slow upstream
 * must never hold the whole search open.
 *
 * @param work - The enrichment promise.
 * @param fallback - The value to use when the budget elapses.
 * @returns Whichever settles first.
 */
async function withBudget<TValue>(
  work: Promise<TValue>,
  fallback: TValue,
): Promise<TValue> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<TValue>((resolve) => {
        timer = setTimeout(() => resolve(fallback), enrichmentBudgetMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Adds artwork, publication years, and expansion status to search candidates.
 *
 * BoardGameGeek's own item data is the artwork source because it always has a
 * cover for games that have one, unlike an image index. Metasearch images are
 * consulted only for whatever it could not answer.
 *
 * @param candidates - The ranked candidates from metasearch.
 * @returns The enriched games, in their original ranking order.
 */
async function enrichCandidates(
  candidates: DiscoveredGame[],
): Promise<DiscoveredGame[]> {
  if (candidates.length === 0) {
    return [];
  }

  const metadata = await withBudget(
    scrapeBggMetadata(candidates.map((game) => game.bggId)).catch(
      () => new Map(),
    ),
    new Map(),
  );
  const enriched = candidates.map((game) => {
    const details = metadata.get(game.bggId);
    return {
      ...game,
      imageUrl: details?.imageUrl ?? game.imageUrl,
      isExpansion: details?.isExpansion || game.isExpansion,
      name: details?.name ?? game.name,
      yearPublished: game.yearPublished ?? details?.yearPublished ?? null,
    };
  });

  const missing = enriched.filter((game) => !game.imageUrl);
  if (missing.length === 0) {
    return enriched;
  }

  const fallbackImages = await withBudget(
    discoverBoardGameImages(
      missing.map((game) => ({ bggId: game.bggId, name: game.name })),
    ).catch(() => new Map<number, string>()),
    new Map<number, string>(),
  );
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
    cached ?? (await enrichCandidates(await searchViaSearxng(normalizedQuery)));
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
