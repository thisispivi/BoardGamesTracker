import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";

/** Account settings stored outside Better Auth's public session shape. */
export type UserPreferences = {
  currency: string;
  shareCollection: boolean;
  sharePrices: boolean;
  shareToken: string | null;
  shareWishlist: boolean;
};

/**
 * Reads settings that are not part of Better Auth's public session shape.
 *
 * @param userId - The authenticated user identifier.
 * @returns The user's display currency and library-sharing preferences.
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const [preferences] = await db
    .select({
      currency: user.currency,
      shareCollection: user.shareCollection,
      sharePrices: user.sharePrices,
      shareToken: user.shareToken,
      shareWishlist: user.shareWishlist,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    currency: preferences?.currency ?? "EUR",
    shareCollection: preferences?.shareCollection ?? false,
    sharePrices: preferences?.sharePrices ?? false,
    shareToken: preferences?.shareToken ?? null,
    shareWishlist: preferences?.shareWishlist ?? false,
  };
}
