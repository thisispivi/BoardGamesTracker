"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  adminPageSchema,
  type AuditLogPage,
  bannedSchema,
  roleSchema,
  userIdSchema,
} from "@/core";
import { env } from "@/env";
import { getAuditLogPage } from "@/server/admin/auditLogs";
import { writeAuditEvent } from "@/server/audit";
import { createPasswordResetToken } from "@/server/auth/passwordReset";
import { db } from "@/server/db";
import { session, user } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/**
 * Returns an authorized audit page without navigating away from the console.
 *
 * @param page - The 'page' value.
 * @returns The documented function result.
 */
export async function getAuditLogPageAction(
  page: number,
): Promise<AuditLogPage> {
  await requireAdmin();
  return getAuditLogPage(adminPageSchema.parse(page));
}

/**
 * Prevents destructive changes to the acting admin and final administrator.
 *
 * @param actorId - The 'actorId' value.
 * @param targetId - The 'targetId' value.
 */
async function assertManageableUser(
  actorId: string,
  targetId: string,
): Promise<void> {
  if (actorId === targetId) {
    throw new Error(
      "Administrators cannot perform this action on their own account.",
    );
  }

  const [target] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, targetId))
    .limit(1);
  if (target?.role === "admin") {
    const [result] = await db
      .select({ value: count() })
      .from(user)
      .where(eq(user.role, "admin"));
    if ((result?.value ?? 0) <= 1) {
      throw new Error("The final administrator cannot be changed or removed.");
    }
  }
}

/**
 * Changes a user's role with last-admin protection.
 *
 * @param formData - The submitted form data.
 * @returns The documented function result.
 */
export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const targetId = userIdSchema.parse(formData.get("userId"));
  const role = roleSchema.parse(formData.get("role"));
  await assertManageableUser(actor.user.id, targetId);
  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, targetId));
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
 * @returns The documented function result.
 */
export async function toggleUserBanAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const targetId = userIdSchema.parse(formData.get("userId"));
  const banned = bannedSchema.parse(formData.get("banned")) === "true";
  await assertManageableUser(actor.user.id, targetId);
  await db
    .update(user)
    .set({
      banExpires: null,
      banned,
      banReason: banned ? "Disabled by administrator" : null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, targetId));
  if (banned) {
    await db.delete(session).where(eq(session.userId, targetId));
  }
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
 * @returns The documented function result.
 */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const targetId = userIdSchema.parse(formData.get("userId"));
  await assertManageableUser(actor.user.id, targetId);
  await db.delete(user).where(eq(user.id, targetId));
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
 * working once it is used or after an hour, whichever comes first.
 *
 * @param formData - The submitted form data.
 * @returns The reset link to hand to the account owner.
 */
export async function createPasswordResetLinkAction(
  formData: FormData,
): Promise<string> {
  const session = await requireAdmin();
  const userId = userIdSchema.parse(formData.get("userId"));
  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!target) {
    throw new Error("The account no longer exists.");
  }

  const token = await createPasswordResetToken(target.id);
  await writeAuditEvent({
    actorId: session.user.id,
    action: "admin.password_reset_issued",
    targetType: "user",
    targetId: target.id,
  });
  return `${env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
}
