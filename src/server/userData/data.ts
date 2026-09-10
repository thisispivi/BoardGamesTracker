import "server-only";

import { eq, inArray, sql } from "drizzle-orm";

import type { UserDataDocument } from "@/core";
import { db } from "@/server/db";
import { collectionItems, games, user } from "@/server/db/schema";

/**
 * Reads portable user data without exporting credentials, sessions, or audit logs.
 *
 * @param userId - The authenticated user identifier.
 * @returns A portable document containing the user's profile and games.
 */
export async function getUserDataDocument(
  userId: string,
): Promise<UserDataDocument> {
  const [profile] = await db
    .select({ name: user.name, email: user.email, currency: user.currency })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!profile) throw new Error("User profile not found.");

  const items = await db
    .select({
      wishlist: collectionItems.wishlist,
      bggId: games.bggId,
      name: games.name,
      description: games.description,
      imageUrl: games.imageUrl,
      yearPublished: games.yearPublished,
      minPlayers: games.minPlayers,
      maxPlayers: games.maxPlayers,
      minPlaytime: games.minPlaytime,
      maxPlaytime: games.maxPlaytime,
      weight: games.weight,
      bggRating: games.bggRating,
      isExpansion: games.isExpansion,
      expandsBggIds: games.expandsBggIds,
      expansionBggIds: games.expansionBggIds,
      categories: games.categories,
      mechanics: games.mechanics,
      families: games.families,
      favorite: collectionItems.favorite,
      hasPlayed: collectionItems.hasPlayed,
      personalRating: collectionItems.personalRating,
      notes: collectionItems.notes,
      moneySpent: collectionItems.moneySpent,
      gifted: collectionItems.gifted,
    })
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(eq(collectionItems.userId, userId));

  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    profile,
    items: items.map(({ wishlist, ...item }) => ({
      ...item,
      location: wishlist ? "wishlist" : "collection",
    })),
  };
}

/**
 * Merges validated account data without overwriting existing catalog metadata.
 *
 * @param userId - The authenticated user identifier.
 * @param document - The portable user-data document.
 * @returns The outcome of the validated import operation.
 */
export async function importUserDataDocument(
  userId: string,
  document: UserDataDocument,
): Promise<number> {
  const now = new Date();
  await db.transaction(async (transaction) => {
    await transaction
      .update(user)
      .set({ currency: document.profile.currency, updatedAt: now })
      .where(eq(user.id, userId));

    if (document.items.length === 0) return;
    await transaction
      .insert(games)
      .values(
        document.items.map((item) => ({
          bggId: item.bggId,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          thumbnailUrl: item.imageUrl,
          yearPublished: item.yearPublished,
          minPlayers: item.minPlayers,
          maxPlayers: item.maxPlayers,
          minPlaytime: item.minPlaytime,
          maxPlaytime: item.maxPlaytime,
          weight: item.weight,
          bggRating: item.bggRating,
          isExpansion: item.isExpansion,
          expandsBggIds: item.expandsBggIds,
          expansionBggIds: item.expansionBggIds,
          categories: item.categories,
          mechanics: item.mechanics,
          families: item.families,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing({ target: games.bggId });
    const savedGames = await transaction
      .select({ id: games.id, bggId: games.bggId })
      .from(games)
      .where(
        inArray(
          games.bggId,
          document.items.map((item) => item.bggId),
        ),
      );
    const gameIds = new Map(savedGames.map((game) => [game.bggId, game.id]));

    await transaction
      .insert(collectionItems)
      .values(
        document.items.flatMap((item) => {
          const gameId = gameIds.get(item.bggId);
          return gameId === undefined
            ? []
            : [
                {
                  userId,
                  gameId,
                  owned: item.location === "collection",
                  wishlist: item.location === "wishlist",
                  favorite: item.favorite,
                  hasPlayed: item.hasPlayed,
                  personalRating: item.personalRating,
                  notes: item.notes,
                  moneySpent: item.moneySpent,
                  gifted: item.gifted,
                  updatedAt: now,
                },
              ];
        }),
      )
      .onConflictDoUpdate({
        target: [collectionItems.userId, collectionItems.gameId],
        set: {
          owned: sql`excluded.owned`,
          wishlist: sql`excluded.wishlist`,
          favorite: sql`excluded.favorite`,
          hasPlayed: sql`excluded.has_played`,
          personalRating: sql`excluded.personal_rating`,
          notes: sql`excluded.notes`,
          moneySpent: sql`excluded.money_spent`,
          gifted: sql`excluded.gifted`,
          updatedAt: now,
        },
      });
  });
  return document.items.length;
}
