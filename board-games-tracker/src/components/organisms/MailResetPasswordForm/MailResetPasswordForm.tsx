"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, type SubmitEvent, useState } from "react";

import { authClient } from "@/client/authClient";
import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Button } from "@/components/atoms/Button/Button";

/** Tokenized properties for the SMTP password-reset form. */
type MailResetPasswordFormProps = {
  token: string;
};

/**
 * Completes a Better Auth password-reset request from an emailed link.
 *
 * @param root0 - Form properties.
 * @param root0.token - Single-use token supplied by Better Auth.
 * @returns The rendered new-password form or success state.
 */
export function MailResetPasswordForm({
  token,
}: MailResetPasswordFormProps): ReactNode {
  const t = useTranslations();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Submits matching new-password fields with the single-use reset token.
   *
   * @param event - Password form submission whose navigation is intercepted.
   * @returns A promise that resolves after the reset request finishes.
   */
  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError(t("reset.mismatch"));
      return;
    }

    setPending(true);
    let outcome;
    try {
      outcome = await authClient.resetPassword({ newPassword, token });
    } catch {
      setError(t("auth.unreachable"));
      return;
    } finally {
      setPending(false);
    }
    if (outcome.error) {
      setError(t("reset.expired"));
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mt-6">
        <p className="text-primary text-sm font-bold">{t("reset.done")}</p>
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
    <form
      className="mt-6 space-y-5"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label className="block text-sm font-bold">
        <span className="mb-2 block">{t("reset.newPassword")}</span>
        <input
          autoComplete="new-password"
          className="field-input"
          maxLength={128}
          minLength={12}
          name="newPassword"
          required
          type="password"
        />
      </label>
      <label className="block text-sm font-bold">
        <span className="mb-2 block">{t("reset.confirmPassword")}</span>
        <input
          autoComplete="new-password"
          className="field-input"
          maxLength={128}
          minLength={12}
          name="confirmation"
          required
          type="password"
        />
      </label>
      <p className="text-muted-foreground text-xs leading-5">
        {t("auth.passwordHelp")}
      </p>
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? (
          <AppSpinner className="size-4" label={t("common.loading")} />
        ) : (
          <KeyRound className="size-4" />
        )}
        {pending ? null : t("reset.submit")}
      </Button>
    </form>
  );
}
