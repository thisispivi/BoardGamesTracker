import "server-only";

import type { NextRequest } from "next/server";

import { env } from "@/env";

/** Accepts only requests provably sent from the application's own origin. */
export function hasTrustedOrigin(request: NextRequest): boolean {
  const expected = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === expected;
  }

  return request.headers.get("sec-fetch-site") === "same-origin";
}
