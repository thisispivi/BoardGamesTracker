import "server-only";

import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";
import { cache } from "react";

import { type CollectionGame, shareTokenSchema } from "@/core";
import { getCollection, getWishlist } from "@/server/collection";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { isCurrentlyBanned } from "@/server/security/ban";
import { redactSharedGames } from "@/utils/shareRedaction";

/** A shared library with prices already removed when the owner opted out. */
export type SharedLibrary = {
  collection: CollectionGame[] | null;
  currency: string;
  name: string;
  sharePrices: boolean;
  wishlist: CollectionGame[] | null;
};

/**
 * Creates an unguessable share token.
 *
 * The token is the only thing protecting a shared library, so it is drawn from
 * a cryptographic source rather than derived from any account value.
 *
 * @returns A 128-bit token as lowercase hexadecimal.
 */
export function createShareToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Reads a shared library by token for an anonymous visitor.
 *
 * The token is the whole authorization check, and each list is returned only
 * when its own switch is on, so nothing reaches the page that the owner has
 * not deliberately published.
 *
 * @param token - The share token from the URL.
 * @returns The shared library, or null when the token matches nothing shared.
 */
export const getSharedLibrary = cache(async function getSharedLibrary(
  token: string,
): Promise<SharedLibrary | null> {
  if (!shareTokenSchema.safeParse(token).success) {
    return null;
  }

  const [owner] = await db
    .select({
      banExpires: user.banExpires,
      banned: user.banned,
      currency: user.currency,
      id: user.id,
      name: user.name,
      shareCollection: user.shareCollection,
      sharePrices: user.sharePrices,
      shareWishlist: user.shareWishlist,
    })
    .from(user)
    .where(eq(user.shareToken, token))
    .limit(1);
  if (!owner || (!owner.shareCollection && !owner.shareWishlist)) {
    return null;
  }
  if (isCurrentlyBanned(owner)) {
    return null;
  }

  const [collection, wishlist] = await Promise.all([
    owner.shareCollection ? getCollection(owner.id) : null,
    owner.shareWishlist ? getWishlist(owner.id) : null,
  ]);
  return {
    collection: collection && redactSharedGames(collection, owner.sharePrices),
    currency: owner.currency,
    name: owner.name,
    sharePrices: owner.sharePrices,
    wishlist: wishlist && redactSharedGames(wishlist, owner.sharePrices),
  };
});
