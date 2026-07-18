import "server-only";

import { user } from "@/server/db/schema";
import { db } from "@/server/db";

/** Returns whether this installation still needs its first administrator. */
export async function isBootstrapRequired(): Promise<boolean> {
  const existingUser = await db.select({ id: user.id }).from(user).limit(1);

  return existingUser.length === 0;
}
