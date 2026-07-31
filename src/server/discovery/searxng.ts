import "server-only";

import Fuse from "fuse.js";

import { type GameDiscoveryResult, searxngResponseSchema } from "@/core";
import { env } from "@/env";
import {
  parseBoardGameImage,
  parseBoardGameResult,
} from "@/server/discovery/resultParser";
import { createSelectionToken } from "@/server/discovery/selectionToken";
import { getWikidataYears } from "@/server/discovery/wikidata";
import { normalizeSearchText } from "@/utils/search";
import { TtlCache } from "@/utils/ttlCache";

type SearchResult =
  (typeof searxngResponseSchema)["_output"]["results"][number];

type DiscoveredGame = Omit<GameDiscoveryResult, "selectionToken">;

/** Maximum discovery results enriched and returned to the client. */
const maxResults = 8;

/**
 * Cached unsigned results keyed by normalized query.
 *
 * Selection tokens are excluded and re-signed on read, so a cache hit never
 * hands out a token closer to expiry than a miss.
 */
const searchCache = new TtlCache<DiscoveredGame[]>(10 * 60_000, 300);

/**
 * Queries one SearXNG category and validates its untrusted JSON response.
 *
 * @param query - The search query.
 * @param category - The optional SearXNG category to restrict results to.
 * @returns The validated result list.
 */
async function requestResults(
  query: string,
  category?: "images",
): Promise<SearchResult[]> {
  const endpoint = new URL("/search", env.SEARXNG_URL);
  endpoint.searchParams.set("q", `site:boardgamegeek.com/boardgame ${query}`);
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("safesearch", "1");
  if (category) {
    endpoint.searchParams.set("categories", category);
  }

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`SearXNG returned ${response.status}.`);
  }

  const parsed = searxngResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("SearXNG returned an invalid response.");
  }
  return parsed.data.results;
}

/**
 * Resolves BGG-hosted artwork for a bounded set of exact game IDs.
 *
 * @param candidates - The games needing artwork, by ID and name.
 * @returns Artwork URLs keyed by BoardGameGeek ID.
 */
export async function discoverBoardGameImages(
  candidates: Array<{ bggId: number; name: string }>,
): Promise<Map<number, string>> {
  const uniqueCandidates = [
    ...new Map(
      candidates
        .filter(
          (game) =>
            Number.isInteger(game.bggId) &&
            game.bggId > 0 &&
            game.bggId <= 10_000_000,
        )
        .map((game) => [game.bggId, game]),
    ).values(),
  ].slice(0, 2_000);
  const uniqueIds = uniqueCandidates.map((game) => game.bggId);
  const batches: number[][] = [];
  for (let index = 0; index < uniqueIds.length; index += 6) {
    batches.push(uniqueIds.slice(index, index + 6));
  }

  const images = new Map<number, string>();
  for (let index = 0; index < batches.length; index += 3) {
    const group = batches.slice(index, index + 3);
    const responses = await Promise.all(
      group.map((batch) =>
        requestResults(batch.join(" OR "), "images").catch(() => []),
      ),
    );
    for (const results of responses) {
      for (const result of results) {
        const image = parseBoardGameImage(result.url, result.img_src);
        if (
          image &&
          uniqueIds.includes(image.bggId) &&
          !images.has(image.bggId)
        ) {
          images.set(image.bggId, image.imageUrl);
        }
      }
    }
  }

  const missing = uniqueCandidates.filter((game) => !images.has(game.bggId));
  for (let index = 0; index < missing.length; index += 3) {
    const group = missing.slice(index, index + 3);
    const responses = await Promise.all(
      group.map((game) =>
        requestResults(`"${game.bggId}" "${game.name}"`, "images").catch(
          () => [],
        ),
      ),
    );
    for (let resultIndex = 0; resultIndex < responses.length; resultIndex++) {
      const candidate = group[resultIndex];
      if (!candidate) {
        continue;
      }
      for (const result of responses[resultIndex] ?? []) {
        const image = parseBoardGameImage(result.url, result.img_src);
        if (image?.bggId === candidate.bggId) {
          images.set(candidate.bggId, image.imageUrl);
          break;
        }
      }
    }
  }
  return images;
}

/**
 * Discovers BGG links for a query without requesting or parsing BGG pages.
 *
 * @param normalizedQuery - The normalized, non-empty search term.
 * @returns The ranked and enriched games, without selection tokens.
 */
async function discoverGames(
  normalizedQuery: string,
): Promise<DiscoveredGame[]> {
  const [webResults, imageResults] = await Promise.all([
    requestResults(normalizedQuery),
    requestResults(normalizedQuery, "images").catch(() => []),
  ]);
  const discovered = new Map<number, DiscoveredGame>();
  for (const result of webResults) {
    const game = parseBoardGameResult(result.title, result.url);
    if (game && !discovered.has(game.bggId)) {
      discovered.set(game.bggId, game);
    }
    if (discovered.size >= 12) {
      break;
    }
  }

  const images = new Map<number, string>();
  for (const result of imageResults) {
    const image = parseBoardGameImage(result.url, result.img_src);
    if (image && !images.has(image.bggId)) {
      images.set(image.bggId, image.imageUrl);
    }
  }
  const games = [...discovered.values()];
  const ranked = new Fuse(games, {
    keys: ["name"],
    threshold: 0.5,
    ignoreLocation: true,
    useExtendedSearch: false,
  })
    .search(normalizedQuery)
    .map((result) => result.item);
  const orderedGames = (ranked.length > 0 ? ranked : games).slice(
    0,
    maxResults,
  );

  const [fallbackImages, years] = await Promise.all([
    discoverBoardGameImages(
      orderedGames
        .filter((game) => !images.has(game.bggId))
        .map((game) => ({ bggId: game.bggId, name: game.name })),
    ).catch(() => new Map<number, string>()),
    getWikidataYears(orderedGames.map((game) => game.bggId)).catch(
      () => new Map<number, number>(),
    ),
  ]);
  for (const [bggId, imageUrl] of fallbackImages) {
    images.set(bggId, imageUrl);
  }

  return orderedGames.map((game) => ({
    ...game,
    imageUrl: images.get(game.bggId) ?? null,
    yearPublished: game.yearPublished ?? years.get(game.bggId) ?? null,
  }));
}

/**
 * Reports whether a result set is worth caching.
 *
 * A non-empty result set in which nothing resolved artwork is the signature of
 * a failed or throttled image lookup rather than a genuine answer, and caching
 * it would keep serving pictureless results long after the cause cleared.
 *
 * @param games - The freshly discovered games.
 * @returns Whether the results may be stored.
 */
function isCacheable(games: DiscoveredGame[]): boolean {
  return games.length === 0 || games.some((game) => game.imageUrl !== null);
}

/**
 * Searches BoardGameGeek games, serving repeated queries from a short cache.
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
  const games = cached ?? (await discoverGames(normalizedQuery));
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
