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

/**
 * A session that passed validation, ban checks, and per-user rate limiting.
 *
 * Better Auth owns the shape, so it is derived from the API rather than
 * restated here where it could drift from the installed version.
 */
type ValidatedSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

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
 * A banned account, or one past its per-user request allowance, is treated as
 * signed out rather than given a distinct outcome: every caller already has to
 * handle an absent session, and the alternative is a second failure mode in
 * every page and route that reads one.
 *
 * @returns The active session, or null when the request may not proceed.
 */
export async function getSession(): Promise<ValidatedSession | null> {
  return getCachedSession();
}

/**
 * Requires an authenticated user and redirects anonymous visitors.
 *
 * @returns The authenticated session after account-access checks.
 */
export async function requireUser(): Promise<ValidatedSession> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Requires an administrator and redirects unauthorized users.
 *
 * @returns The authenticated administrator session.
 */
export async function requireAdmin(): Promise<ValidatedSession> {
  const session = await requireUser();

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
