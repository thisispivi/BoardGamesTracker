import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { type GameSelection, selectionSchema } from "@/core";
import { env } from "@/env";

/**
 * Creates an authenticated, short-lived token for a discovery result.
 *
 * @param selection - The game selection to sign.
 * @returns A signed token carrying the selection, valid for one hour.
 */
export function createSelectionToken(selection: GameSelection): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...selection,
      expiresAt: Date.now() + 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies and decodes an authenticated discovery selection.
 *
 * @param token - The signed selection token.
 * @returns The verified token payload, or null when verification fails.
 */
export function verifySelectionToken(token: string): GameSelection | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return null;
  }

  const expected = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(payload)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  try {
    const decoded = selectionSchema.safeParse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (!decoded.success || decoded.data.expiresAt < Date.now()) {
      return null;
    }
    return {
      bggId: decoded.data.bggId,
      imageUrl: decoded.data.imageUrl,
      isExpansion: decoded.data.isExpansion,
      name: decoded.data.name,
      yearPublished: decoded.data.yearPublished,
    };
  } catch {
    return null;
  }
}
