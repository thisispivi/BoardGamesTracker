import type { GameDiscoveryResult } from "@/core";
import { normalizeSearchText } from "@/utils/search";

/** BGG "thing" sections that map onto a collectable game entry. */
const gameSections = new Set([
  "boardgame",
  "boardgameexpansion",
  "boardgameaccessory",
  "boardgameintegration",
]);

/** Sections that BGG itself models as expansions rather than base games. */
const expansionSections = new Set(["boardgameexpansion", "boardgameaccessory"]);

/** Parsed identity of one BoardGameGeek game, expansion, or accessory. */
export type BggUrlIdentity = {
  bggId: number;
  bggUrl: string;
  isExpansion: boolean;
};

/**
 * Parses any BoardGameGeek game URL into its stable canonical identity.
 *
 * Accepts deep sub-paths, query strings, fragments, `www.`, a missing scheme,
 * and the expansion and accessory sections. The returned URL is rebuilt from
 * the section and numeric ID, so no other part of the input is ever trusted.
 *
 * @param rawUrl - The untrusted URL text supplied by a user or metasearch hit.
 * @returns The canonical identity, or null when the URL is not a BGG game.
 */
export function parseBoardGameUrl(rawUrl: string): BggUrlIdentity | null {
  const trimmed = rawUrl.trim();
  if (trimmed === "" || trimmed.length > 2_000) {
    return null;
  }

  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    if (
      url.hostname.toLowerCase().replace(/^www\./, "") !== "boardgamegeek.com"
    ) {
      return null;
    }

    const path = url.pathname.match(/^\/([a-z]+)\/(\d+)(?:\/.*)?$/i);
    const section = path?.[1]?.toLowerCase() ?? "";
    const bggId = Number(path?.[2]);
    if (
      !gameSections.has(section) ||
      !Number.isSafeInteger(bggId) ||
      bggId <= 0 ||
      bggId > 10_000_000
    ) {
      return null;
    }

    return {
      bggId,
      bggUrl: `https://boardgamegeek.com/${section}/${bggId}`,
      isExpansion: expansionSections.has(section),
    };
  } catch {
    return null;
  }
}

/**
 * Extracts a strict canonical BGG identity from a metasearch result.
 *
 * @param title - The untrusted result title.
 * @param rawUrl - The untrusted result URL.
 * @returns The normalized discovery result, or null when it is not a game.
 */
export function parseBoardGameResult(
  title: string,
  rawUrl: string,
): Omit<GameDiscoveryResult, "selectionToken"> | null {
  try {
    const parsedUrl = parseBoardGameUrl(rawUrl);
    if (!parsedUrl) return null;

    const cleaned = title
      .replace(/\s*[|–-]\s*BoardGameGeek\s*$/i, "")
      .replace(/\s*[|–-]\s*Board(?:\s+Game)?(?:\.{3}|…)?\s*[|–-]?\s*$/i, "")
      .trim();
    const yearMatch = cleaned.match(/\s*\(((?:18|19|20)\d{2})\)\s*$/);
    const name = cleaned.replace(/\s*\((?:18|19|20)\d{2}\)\s*$/, "").trim();
    if (!name || name.length > 160) {
      return null;
    }

    const yearPublished = yearMatch ? Number(yearMatch[1]) : null;
    return {
      ...parsedUrl,
      imageUrl: null,
      name,
      yearPublished,
    };
  } catch {
    return null;
  }
}

/**
 * Accepts only BGG page-to-CDN image pairs returned by image discovery.
 *
 * @param pageUrl - The untrusted BGG page URL the image was found on.
 * @param rawImageUrl - The untrusted image source URL.
 * @returns The game-to-artwork pair, or null when either URL is untrusted.
 */
export function parseBoardGameImage(
  pageUrl: string,
  rawImageUrl: string,
): { bggId: number; imageUrl: string } | null {
  const game = parseBoardGameUrl(pageUrl);
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

/**
 * Accepts candidate artwork discovered on a matching public BGG image page.
 *
 * Image-search engines commonly return BGG gallery URLs rather than canonical
 * game URLs. The page slug must still match the candidate name before its
 * allowlisted CDN image can be associated with that candidate.
 *
 * @param pageUrl - The untrusted image-result page URL.
 * @param rawImageUrl - The untrusted image source URL.
 * @param candidateName - The canonical candidate name from general search.
 * @returns A trusted artwork URL, or null when the result is unrelated.
 */
export function parseBoardGameArtwork(
  pageUrl: string,
  rawImageUrl: string,
  candidateName: string,
): string | null {
  try {
    const page = new URL(pageUrl);
    const image = new URL(rawImageUrl);
    if (
      (page.protocol !== "https:" && page.protocol !== "http:") ||
      page.hostname.toLowerCase().replace(/^www\./, "") !==
        "boardgamegeek.com" ||
      image.protocol !== "https:" ||
      image.hostname !== "cf.geekdo-images.com"
    ) {
      return null;
    }

    const slug = page.pathname.match(
      /^\/(?:image|boardgame|boardgameexpansion|boardgameaccessory|boardgameintegration)\/\d+\/([^/]+)/i,
    )?.[1];
    const normalizedName = normalizeSearchText(candidateName);
    const normalizedSlug = normalizeSearchText(slug ?? "");
    if (
      normalizedName === "" ||
      normalizedSlug === "" ||
      normalizedName !== normalizedSlug
    ) {
      return null;
    }
    return image.toString();
  } catch {
    return null;
  }
}
