import "server-only";

import { and, asc, count, eq } from "drizzle-orm";
import { cache } from "react";

import type { CollectionGame } from "@/core";
import { getCollection } from "@/server/collection";
import { db } from "@/server/db";
import { collectionItems, user } from "@/server/db/schema";

/** One publicly listed collection owner. */
export type SharedCollectionSummary = {
  games: number;
  name: string;
  userId: string;
};

/** A shared collection with prices already removed when opted out. */
export type SharedCollection = {
  currency: string;
  games: CollectionGame[];
  name: string;
  sharePrices: boolean;
};

/**
 * Lists every user who has opted in to sharing their owned collection.
 *
 * @returns The shared collections, alphabetized by owner name.
 */
export async function listSharedCollections(): Promise<
  SharedCollectionSummary[]
> {
  const rows = await db
    .select({
      games: count(collectionItems.id),
      name: user.name,
      userId: user.id,
    })
    .from(user)
    .leftJoin(
      collectionItems,
      and(eq(collectionItems.userId, user.id), eq(collectionItems.owned, true)),
    )
    .where(eq(user.shareCollection, true))
    .groupBy(user.id, user.name)
    .orderBy(asc(user.name));

  return rows;
}

/**
 * Reads one shared collection, redacting prices unless the owner shares them.
 *
 * Sharing is verified here rather than at the page, so no caller can render a
 * collection whose owner has not opted in.
 *
 * @param userId - The collection owner's identifier.
 * @returns The shared collection, or null when the owner does not share it.
 */
export const getSharedCollection = cache(async function getSharedCollection(
  userId: string,
): Promise<SharedCollection | null> {
  const [owner] = await db
    .select({
      currency: user.currency,
      name: user.name,
      shareCollection: user.shareCollection,
      sharePrices: user.sharePrices,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!owner?.shareCollection) {
    return null;
  }

  const games = await getCollection(userId);
  return {
    currency: owner.currency,
    games: owner.sharePrices
      ? games
      : games.map((game) => ({
          ...game,
          gifted: false,
          moneySpent: 0,
          notes: "",
          personalRating: null,
        })),
    name: owner.name,
    sharePrices: owner.sharePrices,
  };
});
