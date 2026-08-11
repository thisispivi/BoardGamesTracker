import "server-only";

import type { GameDiscoveryResult } from "@/core";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { parseBoardGameUrl } from "@/server/discovery/resultParser";
import { searchBoardGames } from "@/server/discovery/search";
import { createSelectionToken } from "@/server/discovery/selectionToken";

/**
 * Resolves a pasted BGG URL through scraped public sources.
 *
 * Public HTML is preferred. When BGG blocks the page scrape, the validated ID
 * is searched through SearXNG and the URL section remains authoritative for
 * expansion status.
 *
 * @param rawUrl - The untrusted URL text pasted by the user.
 * @returns The signed discovery result, or null when the URL is not a game.
 */
export async function discoverBoardGameByUrl(
  rawUrl: string,
): Promise<GameDiscoveryResult | null> {
  const parsed = parseBoardGameUrl(rawUrl);
  if (!parsed) return null;
  const metadata = (await scrapeBggMetadata([parsed.bggId])).get(parsed.bggId);
  const discovered = metadata
    ? null
    : (await searchBoardGames(String(parsed.bggId))).find(
        (game) => game.bggId === parsed.bggId,
      );
  if (!metadata && !discovered) return null;
  const selection = {
    bggId: parsed.bggId,
    imageUrl: metadata?.imageUrl ?? discovered?.imageUrl ?? null,
    isExpansion:
      (metadata?.isExpansion ?? discovered?.isExpansion ?? false) ||
      parsed.isExpansion,
    name: metadata?.name ?? discovered?.name ?? "",
    yearPublished: metadata?.yearPublished ?? discovered?.yearPublished ?? null,
  };
  return {
    ...parsed,
    ...selection,
    selectionToken: createSelectionToken(selection),
  };
}
