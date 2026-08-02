import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { session as sessionTable } from "@/server/db/schema";
import { isCurrentlyBanned } from "@/server/security/ban";
import { consumeRateLimit } from "@/server/security/rateLimit";
import { log } from "@/utils/logger";

const userRequestLimit = 300;
const userRequestWindowMs = 60_000;

const getCachedSession = cache(async () => {
  const active = await auth.api
    .getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    })
    .catch((error: unknown) => {
      log("error", "session_validation_failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    });
  if (!active) {
    return null;
  }

  if (isCurrentlyBanned(active.user)) {
    await db
      .delete(sessionTable)
      .where(eq(sessionTable.userId, active.user.id));
    log("warn", "session_revoked_for_banned_user", { userId: active.user.id });
    return null;
  }

  if (
    !consumeRateLimit(
      `userRequests:${active.user.id}`,
      userRequestLimit,
      userRequestWindowMs,
    )
  ) {
    log("warn", "user_request_rate_limit_exceeded", {
      userId: active.user.id,
    });
    return null;
  }

  return active;
});

/**
 * Returns the fully validated session for the current request.
 *
 * @returns The documented function result.
 */
export async function getSession() {
  return getCachedSession();
}

/**
 * Requires an authenticated user and redirects anonymous visitors.
 *
 * @returns The documented function result.
 */
export async function requireUser() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Requires an administrator and redirects unauthorized users.
 *
 * @returns The documented function result.
 */
export async function requireAdmin() {
  const session = await requireUser();

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
