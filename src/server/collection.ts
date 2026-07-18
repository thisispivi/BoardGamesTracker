import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { collectionItems, games } from "@/server/db/schema";

/** Fetches one user library location with normalized game metadata. */
async function getLibraryItems(userId: string, location: "owned" | "wishlist") {
  const collection = await db
    .select({
      id: collectionItems.id,
      favorite: collectionItems.favorite,
      personalRating: collectionItems.personalRating,
      notes: collectionItems.notes,
      moneySpent: collectionItems.moneySpent,
      gameId: games.id,
      bggId: games.bggId,
      name: games.name,
      imageUrl: games.imageUrl,
      thumbnailUrl: games.thumbnailUrl,
      imageChecksum: games.imageChecksum,
      yearPublished: games.yearPublished,
      minPlayers: games.minPlayers,
      maxPlayers: games.maxPlayers,
      minPlaytime: games.minPlaytime,
      maxPlaytime: games.maxPlaytime,
      weight: games.weight,
      bggRating: games.bggRating,
      isExpansion: games.isExpansion,
      categories: games.categories,
      mechanics: games.mechanics,
      families: games.families,
    })
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(
      and(
        eq(collectionItems.userId, userId),
        location === "owned"
          ? eq(collectionItems.owned, true)
          : eq(collectionItems.wishlist, true),
      ),
    )
    .orderBy(asc(games.name));

  return collection.map(({ imageChecksum, ...game }) => {
    const cachedUrl = imageChecksum
      ? `/api/game-images/${imageChecksum}`
      : null;
    return {
      ...game,
      imageUrl: cachedUrl ?? game.imageUrl,
      thumbnailUrl: cachedUrl ?? game.thumbnailUrl,
    };
  });
}

/** Fetches a user's owned board-game collection. */
export function getCollection(userId: string) {
  return getLibraryItems(userId, "owned");
}

/** Fetches a user's games saved for a future purchase. */
export function getWishlist(userId: string) {
  return getLibraryItems(userId, "wishlist");
}
