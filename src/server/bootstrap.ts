import "server-only";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";

/** Returns whether this installation still needs its first administrator. */
export async function isBootstrapRequired(): Promise<boolean> {
  const existingUser = await db.select({ id: user.id }).from(user).limit(1);

  return existingUser.length === 0;
}
