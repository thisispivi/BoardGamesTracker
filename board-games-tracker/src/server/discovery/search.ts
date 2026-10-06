import "server-only";

import type { BggMetadata, DiscoveredGame, GameDiscoveryResult } from "@/core";
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

/** Time allowed for optional public-page metadata enrichment. */
const metadataBudgetMs = 5_000;

/** Time allowed for the SearXNG image fallback. */
const imageBudgetMs = 8_000;

/**
 * Resolves a slower enrichment step, or gives up and returns a fallback.
 *
 * Enrichment only decorates results that are already usable, so a slow upstream
 * must never hold the whole search open.
 *
 * @param work - The enrichment promise.
 * @param fallback - The value to use when the budget elapses.
 * @param budgetMs - The maximum stage duration in milliseconds.
 * @returns Whichever settles first.
 */
async function withBudget<TValue>(
  work: Promise<TValue>,
  fallback: TValue,
  budgetMs: number,
): Promise<TValue> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<TValue>((resolve) => {
        timer = setTimeout(() => resolve(fallback), budgetMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Populates SearXNG links with scraped metadata and artwork.
 *
 * Public-page HTML and image metasearch run concurrently so a blocked BGG page
 * cannot delay the source that already discovered the result. Both are soft
 * enrichment: the validated link and title remain usable on their own.
 *
 * @param candidates - The ranked candidates from metasearch.
 * @returns The candidates with whatever artwork could be resolved.
 */
async function enrichCandidates(
  candidates: DiscoveredGame[],
): Promise<DiscoveredGame[]> {
  if (candidates.length === 0) {
    return [];
  }

  const [metadata, images] = await Promise.all([
    withBudget(
      scrapeBggMetadata(candidates.map((game) => game.bggId)).catch(
        () => new Map<number, BggMetadata>(),
      ),
      new Map<number, BggMetadata>(),
      metadataBudgetMs,
    ),
    withBudget(
      discoverBoardGameImages(
        candidates.map((game) => ({ bggId: game.bggId, name: game.name })),
      ).catch(() => new Map<number, string>()),
      new Map<number, string>(),
      imageBudgetMs,
    ),
  ]);
  return candidates.map((game) => {
    const details = metadata.get(game.bggId);
    return {
      ...game,
      imageUrl:
        details?.imageUrl ?? game.imageUrl ?? images.get(game.bggId) ?? null,
      isExpansion: details?.isExpansion ?? game.isExpansion,
      name: details?.name ?? game.name,
      yearPublished: details?.yearPublished ?? game.yearPublished,
    };
  });
}

/**
 * Reports whether a result set is worth caching.
 *
 * An empty answer, or one where no artwork resolved, is usually a starved
 * upstream rather than a real result. Caching it would serve that failure for
 * the whole lifetime instead of letting the next keystroke retry.
 *
 * @param games - The freshly discovered games.
 * @returns Whether the results may be stored.
 */
function isCacheable(games: DiscoveredGame[]): boolean {
  return games.length > 0 && games.some((game) => game.imageUrl !== null);
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
  const trimmedQuery = query.trim();
  const cacheKey = normalized === "" ? trimmedQuery : normalized;
  const cached = searchCache.get(cacheKey);
  const games =
    cached ?? (await enrichCandidates(await searchViaSearxng(trimmedQuery)));
  if (!cached && isCacheable(games)) {
    searchCache.set(cacheKey, games);
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
