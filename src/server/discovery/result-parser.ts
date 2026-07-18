import type { GameDiscoveryResult } from "@/server/discovery/types";

/** Extracts a strict canonical BGG identity from a metasearch result. */
export function parseBoardGameResult(
  title: string,
  rawUrl: string,
): Omit<GameDiscoveryResult, "selectionToken"> | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.match(/^\/boardgame\/(\d+)(?:\/[^/]+)?\/?$/);
    if (
      url.protocol !== "https:" ||
      hostname !== "boardgamegeek.com" ||
      !path
    ) {
      return null;
    }

    const bggId = Number(path[1]);
    if (!Number.isSafeInteger(bggId) || bggId <= 0 || bggId > 10_000_000) {
      return null;
    }

    const cleaned = title
      .replace(/\s*[|–-]\s*(?:Board Game\s*[|–-]\s*)?BoardGameGeek\s*$/i, "")
      .trim();
    const yearMatch = cleaned.match(/\s*\(((?:18|19|20)\d{2})\)\s*$/);
    const name = cleaned.replace(/\s*\((?:18|19|20)\d{2}\)\s*$/, "").trim();
    if (!name || name.length > 160) {
      return null;
    }

    const yearPublished = yearMatch ? Number(yearMatch[1]) : null;
    return {
      bggId,
      bggUrl: `https://boardgamegeek.com/boardgame/${bggId}`,
      imageUrl: null,
      name,
      yearPublished,
    };
  } catch {
    return null;
  }
}

/** Accepts only BGG page-to-CDN image pairs returned by image discovery. */
export function parseBoardGameImage(
  pageUrl: string,
  rawImageUrl: string,
): { bggId: number; imageUrl: string } | null {
  const game = parseBoardGameResult("Image result", pageUrl);
  if (!game) {
    return null;
  }

  try {
    const image = new URL(rawImageUrl);
    if (
      image.protocol !== "https:" ||
      image.hostname !== "cf.geekdo-images.com"
    ) {
      return null;
    }
    return { bggId: game.bggId, imageUrl: image.toString() };
  } catch {
    return null;
  }
}
