import { sql } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";

/**
 * Minimal orchestrator health check without sensitive diagnostics.
 *
 * @param request - The incoming request.
 * @returns The HTTP response for the request.
 */
export async function GET(request: Request): Promise<Response> {
  if (
    env.HEALTH_CHECK_TOKEN &&
    request.headers.get("authorization") !== `Bearer ${env.HEALTH_CHECK_TOKEN}`
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
