import "server-only";

import { headers } from "next/headers";

import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { log } from "@/server/logger";
import { resolveClientIp } from "@/server/security/clientIp";

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
 * The recorded address comes from `resolveClientIp`, the same trusted-proxy
 * walk the rate limiter uses, so a client cannot write a forged address into
 * the log by prepending it to `X-Forwarded-For`.
 *
 * @param input - Validated audit event fields to persist.
 * @returns A promise that resolves after the audit event is persisted.
 */
export async function writeAuditEvent(input: AuditInput): Promise<void> {
  const ipAddress = resolveClientIp((await headers()).get("x-forwarded-for"));

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
