import "server-only";

import Fuse from "fuse.js";

import { type DiscoveredGame, searxngResponseSchema } from "@/core";
import { env } from "@/env";
import {
  parseBoardGameArtwork,
  parseBoardGameImage,
  parseBoardGameResult,
} from "@/server/discovery/resultParser";
import { normalizeSearchText } from "@/utils/search";

type SearchResult =
  (typeof searxngResponseSchema)["_output"]["results"][number];

/** Maximum BGG links enriched and returned to the caller. */
const maxResults = 4;

/**
 * How many links are collected before ranking.
 *
 * Engines order by page relevance, not by title match, so a precise query like
 * "ticket to ride northern lights" can put the wanted edition well below the
 * generic ones. Ranking has to see a wide pool or the right game is discarded
 * before it is ever scored.
 */
const maxCandidates = 20;

/** Number of candidates that makes a second general search unnecessary. */
const minimumCandidates = 1;

/** Free general engines tried one at a time to preserve healthy fallbacks. */
const generalEngines = ["pw", "mjk", "yd", "zpm"] as const;

/**
 * Quotes one bounded term without allowing nested search-engine operators.
 *
 * @param value - User or BGG title text included in a metasearch query.
 * @returns A whitespace-normalized quoted phrase.
 */
function quotedTerm(value: string): string {
  return `"${value.replaceAll('"', " ").replaceAll(/\s+/g, " ").trim()}"`;
}

/**
 * Queries one SearXNG category and validates its untrusted JSON response.
 *
 * @param query - The search query.
 * @param category - The optional SearXNG category to restrict results to.
 * @param engine - The configured SearXNG shortcut that handles the query.
 * @returns The validated result list.
 */
async function requestResults(
  query: string,
  category?: "images",
  engine?: string,
): Promise<SearchResult[]> {
  const endpoint = new URL("/search", env.SEARXNG_URL);
  endpoint.searchParams.set("q", engine ? `!${engine} ${query}` : query);
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
 * Selects the first trusted image belonging to one exact candidate.
 *
 * @param candidate - The BGG identity and canonical name being decorated.
 * @param candidate.bggId - The validated BoardGameGeek identifier.
 * @param candidate.name - The canonical result name used for slug matching.
 * @param results - Untrusted image-search results for that candidate.
 * @returns The first matching BGG CDN URL, or null.
 */
function artworkForCandidate(
  candidate: { bggId: number; name: string },
  results: SearchResult[],
): string | null {
  for (const result of results) {
    const image = parseBoardGameImage(result.url, result.img_src);
    if (image?.bggId === candidate.bggId) {
      return image.imageUrl;
    }
    const artwork = parseBoardGameArtwork(
      result.url,
      result.img_src,
      candidate.name,
    );
    if (artwork) return artwork;
  }
  return null;
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

  const images = new Map<number, string>();
  for (let index = 0; index < uniqueCandidates.length; index += 4) {
    const group = uniqueCandidates.slice(index, index + 4);
    const responses = await Promise.all(
      group.map((game) =>
        requestResults(
          `${quotedTerm(game.name)} BoardGameGeek cover`,
          "images",
          "bii",
        ).catch(() => []),
      ),
    );
    for (let resultIndex = 0; resultIndex < responses.length; resultIndex++) {
      const candidate = group[resultIndex];
      if (!candidate) continue;
      const artwork = artworkForCandidate(
        candidate,
        responses[resultIndex] ?? [],
      );
      if (artwork) {
        images.set(candidate.bggId, artwork);
      }
    }
  }

  const missing = uniqueCandidates.filter((game) => !images.has(game.bggId));
  for (let index = 0; index < missing.length; index += 4) {
    const group = missing.slice(index, index + 4);
    const responses = await Promise.all(
      group.map((game) =>
        requestResults(
          `${quotedTerm(game.name)} BoardGameGeek cover`,
          "images",
          "ddi",
        ).catch(() => []),
      ),
    );
    for (let resultIndex = 0; resultIndex < responses.length; resultIndex++) {
      const candidate = group[resultIndex];
      if (!candidate) {
        continue;
      }
      const artwork = artworkForCandidate(
        candidate,
        responses[resultIndex] ?? [],
      );
      if (artwork) {
        images.set(candidate.bggId, artwork);
      }
    }
  }
  return images;
}

/**
 * Finds BGG game links through the configured metasearch service.
 *
 * One free engine handles the common path. Independent engines are queried in
 * parallel only when the primary finds no BGG link, preserving healthy backups
 * and keeping routine request volume low.
 *
 * @param query - The trimmed, non-empty text supplied by the user.
 * @returns The ranked candidates, without artwork.
 */
export async function searchViaSearxng(
  query: string,
): Promise<DiscoveredGame[]> {
  const collect = (
    results: SearchResult[],
    into: Map<number, DiscoveredGame>,
  ) => {
    for (const result of results) {
      const game = parseBoardGameResult(result.title, result.url);
      if (game && !into.has(game.bggId)) {
        const image = parseBoardGameImage(result.url, result.img_src);
        into.set(game.bggId, {
          ...game,
          imageUrl:
            image?.bggId === game.bggId ? image.imageUrl : game.imageUrl,
        });
      }
      if (into.size >= maxCandidates) {
        return;
      }
    }
  };

  const discovered = new Map<number, DiscoveredGame>();
  const broadQuery = `BoardGameGeek ${query}`;
  collect(
    await requestResults(broadQuery, undefined, generalEngines[0]).catch(
      () => [],
    ),
    discovered,
  );
  if (discovered.size < minimumCandidates) {
    const fallbackResults = await Promise.all(
      generalEngines
        .slice(1)
        .map((engine) =>
          requestResults(broadQuery, undefined, engine).catch(() => []),
        ),
    );
    for (const results of fallbackResults) {
      collect(results, discovered);
    }
  }
  if (discovered.size === 0) {
    collect(
      await requestResults(
        `BoardGameGeek ${quotedTerm(query)}`,
        undefined,
        generalEngines[0],
      ).catch(() => []),
      discovered,
    );
  }

  const games = [...discovered.values()];
  const normalizedQuery = normalizeSearchText(query);
  const fuzzyRanked = new Fuse(games, {
    keys: ["name"],
    threshold: 0.65,
    ignoreLocation: true,
    useExtendedSearch: false,
  })
    .search(normalizedQuery || query)
    .map((result) => result.item);
  const rankedIds = new Set(fuzzyRanked.map((game) => game.bggId));
  return [
    ...fuzzyRanked,
    ...games.filter((game) => !rankedIds.has(game.bggId)),
  ].slice(0, maxResults);
}
