import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";

/**
 * Reads settings that are not part of Better Auth's public session shape.
 *
 * @param userId - The authenticated user identifier.
 * @returns The documented function result.
 */
export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select({ currency: user.currency })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return { currency: preferences?.currency ?? "EUR" };
}
