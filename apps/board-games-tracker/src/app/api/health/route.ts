import { createHash, timingSafeEqual } from "node:crypto";

import { sql } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";

/**
 * Checks a presented authorization header against the health-check token.
 *
 * Both sides are hashed before comparing, so the comparison takes the same time
 * whatever the caller sends and cannot be used to guess the token byte by byte.
 *
 * @param authorization - Authorization header sent by the caller, if any.
 * @param token - Configured health-check token.
 * @returns Whether the header is exactly `Bearer <token>`.
 */
function hasHealthCheckToken(
  authorization: string | null,
  token: string,
): boolean {
  const presented = createHash("sha256")
    .update(authorization ?? "")
    .digest();
  const expected = createHash("sha256").update(`Bearer ${token}`).digest();
  return timingSafeEqual(presented, expected);
}

/**
 * Minimal orchestrator health check without sensitive diagnostics.
 *
 * @param request - The incoming request.
 * @returns The HTTP response for the request.
 */
export async function GET(request: Request): Promise<Response> {
  if (
    env.HEALTH_CHECK_TOKEN &&
    !hasHealthCheckToken(
      request.headers.get("authorization"),
      env.HEALTH_CHECK_TOKEN,
    )
  ) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
