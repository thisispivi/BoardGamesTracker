"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  adminPageSchema,
  type AuditLogPage,
  booleanStringSchema,
  roleSchema,
  userIdSchema,
} from "@/core";
import { env } from "@/env";
import { getAuditLogPage } from "@/server/admin/auditLogs";
import { writeAuditEvent } from "@/server/audit";
import { createPasswordResetToken } from "@/server/auth/passwordReset";
import { db } from "@/server/db";
import { account, collectionItems, session, user } from "@/server/db/schema";
import { isCurrentlyBanned } from "@/server/security/ban";
import { requireAdmin } from "@/server/session";

/**
 * Returns an authorized audit page without navigating away from the console.
 *
 * @param page - One-based page number requested by the client.
 * @returns A bounded page of audit events visible to administrators.
 */
export async function getAuditLogPageAction(
  page: number,
): Promise<AuditLogPage> {
  await requireAdmin();
  return getAuditLogPage(adminPageSchema.parse(page));
}

/** Transaction used to lock and change administrative account state together. */
type AdminTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Locks actor and target together and rechecks the acting administrator.
 *
 * The actor must remain an active administrator and cannot target itself, so
 * every successful change leaves at least that administrator available.
 * Ordered locks also serialize two administrators attempting mutual removal.
 *
 * @param actorId - Administrator who submitted the operation.
 * @param targetId - Account being managed.
 * @param change - Mutation executed only after the locked authorization check.
 * @returns The change's result once the authorized transaction commits.
 */
async function manageUser<TResult>(
  actorId: string,
  targetId: string,
  change: (transaction: AdminTransaction) => Promise<TResult>,
): Promise<TResult> {
  if (actorId === targetId) {
    throw new Error(
      "Administrators cannot perform this action on their own account.",
    );
  }
  return db.transaction(async (transaction) => {
    const accounts = await transaction
      .select()
      .from(user)
      .where(inArray(user.id, [actorId, targetId]))
      .orderBy(asc(user.id))
      .for("update");
    const actor = accounts.find((account) => account.id === actorId);
    const target = accounts.find((account) => account.id === targetId);
    if (
      !actor ||
      actor.role !== "admin" ||
      isCurrentlyBanned(actor) ||
      !target
    ) {
      throw new Error("The account change is no longer authorized.");
    }
    return change(transaction);
  });
}

/**
 * Changes a user's role with last-admin protection.
 *
 * @param formData - The submitted form data.
 * @returns A promise that resolves when the operation completes.
 */
export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const targetId = userIdSchema.parse(formData.get("userId"));
  const role = roleSchema.parse(formData.get("role"));
  await manageUser(actor.user.id, targetId, async (transaction) => {
    await transaction
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, targetId));
  });
  await writeAuditEvent({
    actorId: actor.user.id,
    action: "admin.role_changed",
    targetType: "user",
    targetId,
    metadata: { role },
  });
  revalidatePath("/admin");
}

/**
 * Bans or restores a user and revokes active sessions when banning.
 *
 * @param formData - The submitted form data.
 * @returns A promise that resolves when the operation completes.
 */
export async function toggleUserBanAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const targetId = userIdSchema.parse(formData.get("userId"));
  const banned = booleanStringSchema.parse(formData.get("banned"));
  await manageUser(actor.user.id, targetId, async (transaction) => {
    await transaction
      .update(user)
      .set({
        banExpires: null,
        banned,
        banReason: banned ? "Disabled by administrator" : null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetId));
    if (banned) {
      await transaction.delete(session).where(eq(session.userId, targetId));
    }
  });
  await writeAuditEvent({
    actorId: actor.user.id,
    action: banned ? "admin.user_banned" : "admin.user_restored",
    targetType: "user",
    targetId,
  });
  revalidatePath("/admin");
}

/**
 * Permanently removes a user and all cascade-owned data.
 *
 * @param formData - The submitted form data.
 * @returns A promise that resolves when the operation completes.
 */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const targetId = userIdSchema.parse(formData.get("userId"));
  await manageUser(actor.user.id, targetId, async (transaction) => {
    await transaction.delete(session).where(eq(session.userId, targetId));
    await transaction.delete(account).where(eq(account.userId, targetId));
    await transaction
      .delete(collectionItems)
      .where(eq(collectionItems.userId, targetId));
    await transaction.delete(user).where(eq(user.id, targetId));
  });
  await writeAuditEvent({
    actorId: actor.user.id,
    action: "admin.user_deleted",
    targetType: "user",
    targetId,
  });
  revalidatePath("/admin");
}

/**
 * Issues a one-time password-reset link for a user who is locked out.
 *
 * The link is returned to the administrator to deliver out of band, because a
 * self-hosted instance is not assumed to have a working mail server. It stops
 * working once it is used or after an hour, whichever comes first. Like every
 * cross-account change it runs under {@link manageUser}, so the actor must
 * still be an active administrator and cannot target its own account.
 *
 * @param formData - The submitted form data.
 * @returns The reset link to hand to the account owner.
 */
export async function createPasswordResetLinkAction(
  formData: FormData,
): Promise<string> {
  const session = await requireAdmin();
  const userId = userIdSchema.parse(formData.get("userId"));
  const token = await manageUser(session.user.id, userId, () =>
    createPasswordResetToken(userId),
  );
  await writeAuditEvent({
    actorId: session.user.id,
    action: "admin.password_reset_issued",
    targetType: "user",
    targetId: userId,
  });
  return `${env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
}
