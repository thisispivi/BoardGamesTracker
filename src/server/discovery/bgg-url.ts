import "server-only";

import type { GameDiscoveryResult } from "@/core";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { parseBoardGameUrl } from "@/server/discovery/result-parser";
import { createSelectionToken } from "@/server/discovery/selection-token";

/** Resolves a pasted BGG URL through the same trusted metadata path used on save. */
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
    name: metadata.name,
    yearPublished: metadata.yearPublished,
  };
  return {
    ...parsed,
    ...selection,
    selectionToken: createSelectionToken(selection),
  };
}
