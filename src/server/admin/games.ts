import "server-only";

import { asc, count, eq } from "drizzle-orm";

import type { AdminGame } from "@/core";
import { db } from "@/server/db";
import { collectionItems, games } from "@/server/db/schema";

/**
 * Lists every shared game with how many libraries reference it.
 *
 * Metadata is shared across all collections, so an administrator correcting one
 * record fixes it for every user who owns that game.
 *
 * @returns Every stored game, alphabetized by name.
 */
export async function listAdminGames(): Promise<AdminGame[]> {
  return db
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
    .groupBy(games.id)
    .orderBy(asc(games.name));
}
