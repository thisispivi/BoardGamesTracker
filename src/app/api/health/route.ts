import { sql } from "drizzle-orm";

import { db } from "@/server/db";

/** Minimal orchestrator health check without sensitive diagnostics. */
export async function GET(): Promise<Response> {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
