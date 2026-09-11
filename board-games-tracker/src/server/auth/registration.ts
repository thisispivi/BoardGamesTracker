import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";

/**
 * Serializes registrations across instances so only one request can bootstrap.
 *
 * A nonblocking PostgreSQL lock avoids filling the pool with waiting signups.
 * The handler uses its own connection; the transaction only owns the lock.
 *
 * @param register - Better Auth handler performing the complete registration.
 * @returns The handler response, or a retryable response during another signup.
 */
export async function registerExclusively(
  register: () => Promise<Response>,
): Promise<Response> {
  return db.transaction(async (transaction) => {
    const rows = await transaction.execute(
      sql`select pg_try_advisory_xact_lock(784_213_901) as acquired`,
    );
    const [lock] = z.array(z.object({ acquired: z.boolean() })).parse(rows);
    if (!lock?.acquired) {
      return Response.json(
        { code: "REGISTRATION_BUSY", message: "Please retry registration." },
        {
          status: 429,
          headers: { "Retry-After": "2" },
        },
      );
    }
    return register();
  });
}
