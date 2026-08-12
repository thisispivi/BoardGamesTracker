import "server-only";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { log } from "@/utils/logger";

/**
 * Returns whether this installation still needs its first administrator.
 *
 * @returns Whether the installation still needs its first administrator.
 */
export async function isBootstrapRequired(): Promise<boolean> {
  try {
    const existingUser = await db.select({ id: user.id }).from(user).limit(1);

    return existingUser.length === 0;
  } catch (error) {
    log("error", "bootstrap_check_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
