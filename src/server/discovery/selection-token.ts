import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { env } from "@/env";
import type { GameSelection } from "@/server/discovery/types";

const selectionSchema = z.object({
  bggId: z.number().int().positive().max(10_000_000),
  expiresAt: z.number().int().positive(),
  imageUrl: z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" && url.hostname === "cf.geekdo-images.com"
      );
    })
    .nullable(),
  name: z.string().trim().min(1).max(160),
  yearPublished: z.number().int().min(1800).max(2200).nullable(),
});

/** Creates an authenticated, short-lived token for a discovery result. */
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

/** Verifies and decodes an authenticated discovery selection. */
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
      name: decoded.data.name,
      yearPublished: decoded.data.yearPublished,
    };
  } catch {
    return null;
  }
}
