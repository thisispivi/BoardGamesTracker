import "server-only";

import type { DiscoveredGame, GameDiscoveryResult } from "@/core";
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

/** Time allowed for artwork lookup before results are sent as they are. */
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
 * Adds artwork to search candidates without touching BoardGameGeek.
 *
 * Asking BoardGameGeek for every result of every keystroke gets the whole
 * instance throttled, and a throttled reply then breaks the metadata lookup
 * that actually matters when a game is saved. Full details are fetched once,
 * for the single game the user picks.
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

  const images = await withBudget(
    discoverBoardGameImages(
      candidates.map((game) => ({ bggId: game.bggId, name: game.name })),
    ).catch(() => new Map<number, string>()),
    new Map<number, string>(),
  );
  return candidates.map((game) => ({
    ...game,
    imageUrl: game.imageUrl ?? images.get(game.bggId) ?? null,
  }));
}

/**
 * Reports whether a result set is worth caching.
 *
 * Only a result set that actually found something is stored. An empty answer,
 * or one where nothing resolved artwork, is far more often a starved upstream
 * than a real answer, and caching it would keep serving that failure for the
 * whole cache lifetime instead of letting the next keystroke retry.
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
