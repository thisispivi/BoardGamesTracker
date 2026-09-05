"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { type CollectionActionState, newPasswordSchema } from "@/core";
import { writeAuditEvent } from "@/server/audit";
import {
  applyPasswordReset,
  verifyPasswordResetToken,
} from "@/server/auth/passwordReset";
import { isUserCurrentlyBanned } from "@/server/security/accountAccess";
import { consumeRateLimit } from "@/server/security/rateLimit";

/**
 * Completes an administrator-issued password reset for an anonymous visitor.
 *
 * The signed token is the only authorization, so it is verified before the
 * password is read, and every failure returns the same message so the form
 * cannot be used to discover which links or accounts exist.
 *
 * @param _previous - The previous server-action state.
 * @param formData - The submitted form data.
 * @returns The outcome of the authorized server action.
 */
export async function resetPasswordAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const t = await getTranslations();
  const parsedToken = z
    .string()
    .min(1)
    .max(4_000)
    .safeParse(formData.get("token"));
  if (!parsedToken.success)
    return { success: false, message: t("reset.invalid") };
  const token = parsedToken.data;
  if (!consumeRateLimit("passwordResetAttempts", 30, 600_000)) {
    return { success: false, message: t("reset.tooMany") };
  }

  const userId = await verifyPasswordResetToken(token);
  const password = newPasswordSchema.safeParse(formData.get("password"));
  if (!userId || !password.success || (await isUserCurrentlyBanned(userId))) {
    return { success: false, message: t("reset.invalid") };
  }

  if (!(await applyPasswordReset(userId, password.data, token))) {
    return { success: false, message: t("reset.invalid") };
  }
  await writeAuditEvent({
    actorId: userId,
    action: "auth.password_reset_completed",
    targetType: "user",
    targetId: userId,
  });
  return { success: true, message: t("reset.done") };
}
