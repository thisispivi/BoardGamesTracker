import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/server/auth";

const getCachedSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  }),
);

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
