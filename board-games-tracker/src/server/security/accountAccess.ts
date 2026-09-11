import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { isCurrentlyBanned } from "@/server/security/ban";

/**
 * Reports whether the stored account is currently barred from the application.
 *
 * @param userId - The account identifier to check authoritatively.
 * @returns Whether the account is absent or has an active ban.
 */
export async function isUserCurrentlyBanned(userId: string): Promise<boolean> {
  const [storedUser] = await db
    .select({
      banExpires: user.banExpires,
      banned: user.banned,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return !storedUser || isCurrentlyBanned(storedUser);
}
