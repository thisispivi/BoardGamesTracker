import { count, desc, eq } from "drizzle-orm";

import type { AuditLogPage } from "@/core";
import { db } from "@/server/db";
import { auditLogs, user } from "@/server/db/schema";

const auditLogPageSize = 20;

/**
 * Loads one bounded audit page and serializes its timestamps for the client.
 *
 * @param requestedPage - Untrusted one-based page number requested by the client.
 * @returns A bounded page of recent audit events.
 */
export async function getAuditLogPage(
  requestedPage: number,
): Promise<AuditLogPage> {
  const [result] = await db.select({ value: count() }).from(auditLogs);
  const pages = Math.max(1, Math.ceil((result?.value ?? 0) / auditLogPageSize));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage)), pages);
  const records = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      createdAt: auditLogs.createdAt,
      actorName: user.name,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(auditLogPageSize)
    .offset((page - 1) * auditLogPageSize);

  return {
    events: records.map((record) => ({
      ...record,
      createdAt: record.createdAt.toISOString(),
    })),
    page,
    pages,
  };
}
