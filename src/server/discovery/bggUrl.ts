import "server-only";

import type { GameDiscoveryResult } from "@/core";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { parseBoardGameUrl } from "@/server/discovery/resultParser";
import { createSelectionToken } from "@/server/discovery/selectionToken";

/**
 * Resolves a pasted BGG URL through the same trusted metadata path used on save.
 *
 * Works for base games, expansions, and accessories: the URL section decides
 * the expansion fallback whenever BGG's own metadata is unavailable.
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
  if (!metadata) return null;
  const selection = {
    bggId: parsed.bggId,
    imageUrl: metadata.imageUrl,
    isExpansion: metadata.isExpansion || parsed.isExpansion,
    name: metadata.name,
    yearPublished: metadata.yearPublished,
  };
  return {
    ...parsed,
    ...selection,
    selectionToken: createSelectionToken(selection),
  };
}
