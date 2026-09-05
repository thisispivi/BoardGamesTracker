import "server-only";

import { headers } from "next/headers";

import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { log } from "@/server/logger";

/** Security-relevant event fields accepted by the audit writer. */
type AuditInput = {
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Persists a security-relevant administrative or user event.
 *
 * @param input - Validated audit event fields to persist.
 * @returns A promise that resolves after the audit event is persisted.
 */
export async function writeAuditEvent(input: AuditInput): Promise<void> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ipAddress = forwardedFor ?? requestHeaders.get("x-real-ip");

  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ?? {},
    ipAddress,
  });

  log("info", "audit_event", {
    action: input.action,
    actorId: input.actorId,
    targetType: input.targetType,
    targetId: input.targetId,
  });
}
