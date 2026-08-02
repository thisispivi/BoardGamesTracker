import "server-only";

import { asc, count, eq, ilike, or } from "drizzle-orm";

import type { AdminGamesPage } from "@/core";
import { db } from "@/server/db";
import { collectionItems, games } from "@/server/db/schema";

const adminGamesPageSize = 20;

/**
 * Lists shared games one bounded page at a time, optionally filtered by name or BGG id.
 *
 * Metadata is shared across all collections, so an administrator correcting one
 * record fixes it for every user who owns that game.
 *
 * @param requestedPage - The 'requestedPage' value.
 * @param search - Free text matched against the game name or an exact BGG id.
 * @returns The documented function result.
 */
export async function getAdminGamesPage(
  requestedPage: number,
  search: string,
): Promise<AdminGamesPage> {
  const term = search.trim();
  const numericTerm = /^\d+$/.test(term) ? Number(term) : undefined;
  const filter = term
    ? numericTerm === undefined
      ? ilike(games.name, `%${term}%`)
      : or(ilike(games.name, `%${term}%`), eq(games.bggId, numericTerm))
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
    .orderBy(asc(games.name))
    .limit(adminGamesPageSize)
    .offset((page - 1) * adminGamesPageSize);

  return { games: records, page, pages };
}
