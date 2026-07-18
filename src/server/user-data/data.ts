import "server-only";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { collectionItems, games, user } from "@/server/db/schema";
import type { UserDataDocument } from "@/server/user-data/schema";

/** Reads portable user data without exporting credentials, sessions, or audit logs. */
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
      owned: collectionItems.owned,
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
      categories: games.categories,
      mechanics: games.mechanics,
      families: games.families,
      favorite: collectionItems.favorite,
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
    items: items.map(({ owned, ...item }) => ({
      ...item,
      location: owned ? "collection" : "wishlist",
    })),
  };
}

/** Merges validated portable data into the current account and shared catalog. */
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
        document.items.map((item) => ({
          userId,
          gameId: gameIds.get(item.bggId)!,
          owned: item.location === "collection",
          wishlist: item.location === "wishlist",
          favorite: item.favorite,
          personalRating: item.personalRating,
          notes: item.notes,
          moneySpent: item.moneySpent,
          gifted: item.gifted,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: [collectionItems.userId, collectionItems.gameId],
        set: {
          owned: sql`excluded.owned`,
          wishlist: sql`excluded.wishlist`,
          favorite: sql`excluded.favorite`,
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
