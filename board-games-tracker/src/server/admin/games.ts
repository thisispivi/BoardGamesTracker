import "server-only";

import { asc, count, eq, gt, ilike, or } from "drizzle-orm";

import type { AdminGamesPage, BggMetadata } from "@/core";
import { db } from "@/server/db";
import { collectionItems, games } from "@/server/db/schema";
import { escapeLikePattern } from "@/utils/likePattern";

const adminGamesPageSize = 20;

/**
 * Games re-read from BoardGameGeek per catalog refresh request.
 *
 * The scraper reads four games at a time and one slow game can take about
 * 24 seconds, so eight keeps a worst-case batch under a minute and inside a
 * typical reverse proxy's request timeout.
 */
const catalogRefreshBatchSize = 8;

/** Next slice of the shared catalog visited by a bulk BoardGameGeek refresh. */
type CatalogRefreshWindow = {
  games: { bggId: number; id: string }[];
  nextCursor: string | null;
  total: number;
};

/**
 * Lists shared games one bounded page at a time, optionally filtered by name or BGG id.
 *
 * Metadata is shared across all collections, so an administrator correcting one
 * record fixes it for every user who owns that game.
 *
 * @param requestedPage - Untrusted one-based page number requested by the client.
 * @param search - Free text matched literally against the game name, or an exact BGG id.
 * @returns A bounded page of games matching the optional search term.
 */
export async function getAdminGamesPage(
  requestedPage: number,
  search: string,
): Promise<AdminGamesPage> {
  const term = search.trim();
  const parsedNumber = /^\d{1,8}$/.test(term) ? Number(term) : undefined;
  const numericTerm =
    parsedNumber !== undefined && parsedNumber <= 10_000_000
      ? parsedNumber
      : undefined;
  const namePattern = `%${escapeLikePattern(term)}%`;
  const filter = term
    ? numericTerm === undefined
      ? ilike(games.name, namePattern)
      : or(ilike(games.name, namePattern), eq(games.bggId, numericTerm))
    : undefined;

  const [totalResult] = await db
    .select({ value: count() })
    .from(games)
    .where(filter);
  const pages = Math.max(
    1,
    Math.ceil((totalResult?.value ?? 0) / adminGamesPageSize),
  );
  const page = Math.min(Math.max(1, Math.trunc(requestedPage)), pages);

  const records = await db
    .select({
      bggId: games.bggId,
      bggRating: games.bggRating,
      categories: games.categories,
      description: games.description,
      families: games.families,
      id: games.id,
      imageUrl: games.imageUrl,
      isExpansion: games.isExpansion,
      maxPlayers: games.maxPlayers,
      maxPlaytime: games.maxPlaytime,
      mechanics: games.mechanics,
      minPlayers: games.minPlayers,
      minPlaytime: games.minPlaytime,
      name: games.name,
      owners: count(collectionItems.id),
      weight: games.weight,
      yearPublished: games.yearPublished,
    })
    .from(games)
    .leftJoin(collectionItems, eq(collectionItems.gameId, games.id))
    .where(filter)
    .groupBy(games.id)
    .orderBy(asc(games.name), asc(games.id))
    .limit(adminGamesPageSize)
    .offset((page - 1) * adminGamesPageSize);

  return { games: records, page, pages };
}

/**
 * Reads the next slice of the shared catalog in stable identifier order.
 *
 * Walking by identifier instead of by page offset keeps a long refresh from
 * skipping or repeating a game when another is added or removed mid-run.
 *
 * @param afterGameId - Identifier of the last game already visited, or null to start from the beginning.
 * @returns Up to one batch of games, the cursor to resume from or null once the catalog is exhausted, and the catalog size.
 */
export async function getCatalogRefreshWindow(
  afterGameId: string | null,
): Promise<CatalogRefreshWindow> {
  const [batch, [catalog]] = await Promise.all([
    db
      .select({ bggId: games.bggId, id: games.id })
      .from(games)
      .where(afterGameId === null ? undefined : gt(games.id, afterGameId))
      .orderBy(asc(games.id))
      .limit(catalogRefreshBatchSize),
    db.select({ value: count() }).from(games),
  ]);
  const last = batch.at(-1);
  return {
    games: batch,
    nextCursor:
      batch.length === catalogRefreshBatchSize && last ? last.id : null,
    total: catalog?.value ?? 0,
  };
}

/**
 * Overwrites one shared game with metadata freshly read from BoardGameGeek.
 *
 * Expansion links are kept when BoardGameGeek returns none, because the HTML
 * fallback never reports them and an empty list there means unknown, not absent.
 *
 * @param gameId - Shared game being refreshed.
 * @param metadata - Validated BoardGameGeek metadata for that game's BGG id.
 * @returns Whether the game still existed and was updated.
 */
export async function applyBggMetadata(
  gameId: string,
  metadata: BggMetadata,
): Promise<boolean> {
  const [updated] = await db
    .update(games)
    .set({
      bggRating: metadata.bggRating,
      categories: metadata.categories,
      description: metadata.description,
      ...(metadata.expandsBggIds.length > 0
        ? { expandsBggIds: metadata.expandsBggIds }
        : {}),
      ...(metadata.expansionBggIds.length > 0
        ? { expansionBggIds: metadata.expansionBggIds }
        : {}),
      families: metadata.families,
      isExpansion: metadata.isExpansion,
      maxPlayers: metadata.maxPlayers,
      maxPlaytime: metadata.maxPlaytime,
      mechanics: metadata.mechanics,
      minPlayers: metadata.minPlayers,
      minPlaytime: metadata.minPlaytime,
      name: metadata.name,
      updatedAt: new Date(),
      weight: metadata.weight,
      yearPublished: metadata.yearPublished,
    })
    .where(eq(games.id, gameId))
    .returning({ id: games.id });
  return updated !== undefined;
}
