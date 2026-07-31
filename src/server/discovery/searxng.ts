import "server-only";

import Fuse from "fuse.js";

import { type DiscoveredGame, searxngResponseSchema } from "@/core";
import { env } from "@/env";
import {
  parseBoardGameImage,
  parseBoardGameResult,
} from "@/server/discovery/resultParser";

type SearchResult =
  (typeof searxngResponseSchema)["_output"]["results"][number];

/** Maximum results returned to the caller. */
const maxResults = 8;

/**
 * How many links are collected before ranking.
 *
 * Engines order by page relevance, not by title match, so a precise query like
 * "ticket to ride northern lights" can put the wanted edition well below the
 * generic ones. Ranking has to see a wide pool or the right game is discarded
 * before it is ever scored.
 */
const maxCandidates = 40;

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
 * Finds BGG game links through the configured metasearch service.
 *
 * One request, links and titles only. Artwork and expansion status are filled
 * in afterwards from BoardGameGeek item data, so no image query is issued here
 * and the response is never held open by the slow image engines.
 *
 * @param normalizedQuery - The normalized, non-empty search term.
 * @returns The ranked candidates, without artwork.
 */
export async function searchViaSearxng(
  normalizedQuery: string,
): Promise<DiscoveredGame[]> {
  const webResults = await requestResults(normalizedQuery);
  const discovered = new Map<number, DiscoveredGame>();
  for (const result of webResults) {
    const game = parseBoardGameResult(result.title, result.url);
    if (game && !discovered.has(game.bggId)) {
      discovered.set(game.bggId, game);
    }
    if (discovered.size >= maxCandidates) {
      break;
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
  return (ranked.length > 0 ? ranked : games).slice(0, maxResults);
}
