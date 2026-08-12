"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState } from "react";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Button } from "@/components/atoms/Button/Button";
import type { CollectionActionState } from "@/core";
import { resetPasswordAction } from "@/server/actions/passwordReset";

const initialState: CollectionActionState = { success: false, message: "" };

/** Verified reset token submitted with the new password. */
type ResetPasswordFormProps = {
  token: string;
};

/**
 * New-password form for an administrator-issued reset link.
 *
 * @param root0 - Properties that configure reset password form.
 * @param root0.token - Password-reset token read from the route.
 * @returns The rendered reset password form.
 */
export function ResetPasswordForm({
  token,
}: ResetPasswordFormProps): ReactNode {
  const t = useTranslations();
  const [state, action, saving] = useActionState(
    resetPasswordAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="mt-6">
        <p className="text-primary text-sm font-bold">{state.message}</p>
        <Link
          className="text-primary mt-4 inline-block text-sm font-bold hover:underline"
          href="/login"
        >
          {t("reset.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-5">
      <input name="token" type="hidden" value={token} />
      <label className="block text-sm font-bold">
        <span className="mb-2 block">{t("reset.newPassword")}</span>
        <input
          autoComplete="new-password"
          className="field-input"
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
      </label>
      <p className="text-muted-foreground text-xs leading-5">
        {t("auth.passwordHelp")}
      </p>
      {state.message ? (
        <p className="text-danger text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={saving} type="submit">
        {saving ? (
          <AppSpinner className="size-4" label={t("common.loading")} />
        ) : (
          <KeyRound className="size-4" />
        )}
        {saving ? null : t("reset.submit")}
      </Button>
    </form>
  );
}
