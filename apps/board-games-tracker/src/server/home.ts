import "server-only";

import { and, asc, desc, eq, gt, type SQL, sql } from "drizzle-orm";

import type { HomeSummary } from "@/core";
import {
  librarySelection,
  locationCondition,
  normalizeLibraryRow,
  selectCards,
} from "@/server/collection";
import { db } from "@/server/db";
import { collectionItems, games } from "@/server/db/schema";

/** Covers fanned out in the home hero. */
const showcaseSize = 5;

/** Unplayed base games offered in the home rail. */
const unplayedSize = 12;

/** Latest collection additions listed on the home page. */
const recentSize = 5;

/** Wishlist covers previewed on the home page. */
const wishlistPreviewSize = 4;

/**
 * Counts the library rows matching a predicate.
 *
 * @param condition - Predicate over a collection item and its game.
 * @returns A numeric aggregate expression.
 */
function countWhere(condition: SQL): SQL<number> {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

/**
 * Loads the bounded snapshot of one account's library shown on the home page.
 *
 * Totals come from a single aggregate query and every card list is capped, so
 * the page costs the same for a ten-game shelf and a ten-thousand-game one.
 *
 * @param userId - Authenticated account whose library is summarized.
 * @returns Collection totals, favorite covers, unplayed and recent games, and a wishlist preview.
 */
export async function getHomeSummary(userId: string): Promise<HomeSummary> {
  const owned = locationCondition(userId, "collection");
  const ownedBaseGame = and(owned, eq(games.isExpansion, false));
  const newestFirst = [
    desc(collectionItems.createdAt),
    asc(collectionItems.id),
  ];
  const [totalRows, showcase, unplayed, recentRows, heaviest, wishlist] =
    await Promise.all([
      db
        .select({
          baseGames: countWhere(
            sql`${collectionItems.owned} and not ${games.isExpansion}`,
          ),
          expansions: countWhere(
            sql`${collectionItems.owned} and ${games.isExpansion}`,
          ),
          favorites: countWhere(
            sql`${collectionItems.owned} and ${collectionItems.favorite}`,
          ),
          playedBaseGames: countWhere(
            sql`${collectionItems.owned} and not ${games.isExpansion} and ${collectionItems.hasPlayed}`,
          ),
          totalSpent:
            sql<number>`coalesce(sum(${collectionItems.moneySpent}) filter (where ${collectionItems.owned}), 0)`.mapWith(
              Number,
            ),
          wishlistGames: countWhere(sql`${collectionItems.wishlist}`),
        })
        .from(collectionItems)
        .innerJoin(games, eq(collectionItems.gameId, games.id))
        .where(eq(collectionItems.userId, userId)),
      selectCards(
        ownedBaseGame,
        [
          desc(collectionItems.favorite),
          sql`(${games.imageChecksum} is not null or ${games.imageUrl} is not null) desc`,
          ...newestFirst,
        ],
        showcaseSize,
        0,
      ),
      selectCards(
        and(ownedBaseGame, eq(collectionItems.hasPlayed, false)),
        newestFirst,
        unplayedSize,
        0,
      ),
      db
        .select({ addedAt: collectionItems.createdAt, card: librarySelection })
        .from(collectionItems)
        .innerJoin(games, eq(collectionItems.gameId, games.id))
        .where(owned)
        .orderBy(...newestFirst)
        .limit(recentSize),
      selectCards(
        and(ownedBaseGame, gt(games.weight, 0)),
        [desc(games.weight), asc(games.name), asc(collectionItems.id)],
        1,
        0,
      ),
      selectCards(
        locationCondition(userId, "wishlist"),
        newestFirst,
        wishlistPreviewSize,
        0,
      ),
    ]);
  const totals = totalRows[0];

  return {
    baseGames: totals?.baseGames ?? 0,
    expansions: totals?.expansions ?? 0,
    favorites: totals?.favorites ?? 0,
    heaviestGame: heaviest[0] ?? null,
    playedBaseGames: totals?.playedBaseGames ?? 0,
    recentlyAdded: recentRows.map((row) => ({
      addedAt: row.addedAt,
      game: normalizeLibraryRow(row.card),
    })),
    showcase,
    totalSpent: totals?.totalSpent ?? 0,
    unplayed,
    wishlist,
    wishlistGames: totals?.wishlistGames ?? 0,
  };
}
