import "server-only";

import Fuse from "fuse.js";

import { type GameDiscoveryResult, searxngResponseSchema } from "@/core";
import { env } from "@/env";
import { normalizeSearchText } from "@/lib/search";
import {
  parseBoardGameImage,
  parseBoardGameResult,
} from "@/server/discovery/result-parser";
import { createSelectionToken } from "@/server/discovery/selection-token";
import { getWikidataYears } from "@/server/discovery/wikidata";

type SearchResult =
  (typeof searxngResponseSchema)["_output"]["results"][number];

/** Queries one SearXNG category and validates its untrusted JSON response. */
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

/** Resolves BGG-hosted artwork for a bounded set of exact game IDs. */
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

/** Discovers BGG game links without requesting or parsing BGG pages. */
export async function searchBoardGames(
  query: string,
): Promise<GameDiscoveryResult[]> {
  const normalizedQuery = normalizeSearchText(query) || query.trim();
  const [webResults, imageResults] = await Promise.all([
    requestResults(normalizedQuery),
    requestResults(normalizedQuery, "images").catch(() => []),
  ]);
  const discovered = new Map<
    number,
    Omit<GameDiscoveryResult, "selectionToken">
  >();
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
  const orderedGames = ranked.length > 0 ? ranked : games;
  const fallbackImages = await discoverBoardGameImages(
    orderedGames
      .filter((game) => !images.has(game.bggId))
      .map((game) => ({ bggId: game.bggId, name: game.name })),
  ).catch(() => new Map<number, string>());
  for (const [bggId, imageUrl] of fallbackImages) {
    images.set(bggId, imageUrl);
  }
  const years = await getWikidataYears(
    orderedGames.map((game) => game.bggId),
  ).catch(() => new Map<number, number>());
  return orderedGames.map((game) => {
    const enriched = {
      ...game,
      imageUrl: images.get(game.bggId) ?? null,
      yearPublished: game.yearPublished ?? years.get(game.bggId) ?? null,
    };
    return {
      ...enriched,
      selectionToken: createSelectionToken(enriched),
    };
  });
}
