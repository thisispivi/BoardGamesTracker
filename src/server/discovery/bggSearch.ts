import "server-only";

import { bggSearchResponseSchema, type GameDiscoveryResult } from "@/core";

/** A discovery candidate before artwork and metadata enrichment. */
export type DiscoveredGame = Omit<GameDiscoveryResult, "selectionToken">;

/** Maximum candidates requested from BoardGameGeek for one query. */
const maxCandidates = 8;

/**
 * Reads a bounded publication year from BGG's string-or-number field.
 *
 * @param value - The raw `yearpublished` value.
 * @returns The year, or null when absent or out of range.
 */
function publicationYear(value: unknown): number | null {
  const year = Number(value);
  return Number.isSafeInteger(year) && year >= 1800 && year <= 2200
    ? year
    : null;
}

/**
 * Searches BoardGameGeek's own game index for a bounded set of candidates.
 *
 * This is the primary discovery source: it is authoritative, needs no API key,
 * and returns stable numeric IDs that the metadata step turns into artwork.
 * Expansion status is deliberately not read here because the index reports
 * every result as `boardgame`, even for true expansions.
 *
 * @param query - The normalized, non-empty search term.
 * @returns The ranked candidates, without artwork or expansion status.
 */
export async function searchBggGames(query: string): Promise<DiscoveredGame[]> {
  const endpoint = new URL("https://boardgamegeek.com/search/boardgame");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("showcount", String(maxCandidates));
  endpoint.searchParams.set("nosession", "1");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted collection metadata)",
    },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    throw new Error(`BoardGameGeek search returned ${response.status}.`);
  }

  const parsed = bggSearchResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("BoardGameGeek search returned an invalid response.");
  }

  const games = new Map<number, DiscoveredGame>();
  for (const item of parsed.data.items) {
    const bggId = Number(item.objectid);
    const name = item.name?.trim() ?? "";
    if (
      !Number.isSafeInteger(bggId) ||
      bggId <= 0 ||
      bggId > 10_000_000 ||
      name === "" ||
      name.length > 160 ||
      (item.objecttype != null && item.objecttype !== "thing") ||
      games.has(bggId)
    ) {
      continue;
    }
    games.set(bggId, {
      bggId,
      bggUrl: `https://boardgamegeek.com/boardgame/${bggId}`,
      imageUrl: null,
      isExpansion: false,
      name,
      yearPublished: publicationYear(item.yearpublished),
    });
  }
  return [...games.values()].slice(0, maxCandidates);
}
