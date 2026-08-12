"use client";

import { KeyRound, ShieldCheck, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button/Button";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import { authClient } from "@/utils/authClient";

/** Account preferences displayed and edited by the settings card. */
type AccountSettingsCardProps = {
  email: string;
};

/**
 * Lets an account owner update credentials or permanently delete the account.
 *
 * @param root0 - Component properties.
 * @param root0.email - The account's current email address.
 * @returns The rendered account settings controls.
 */
export function AccountSettingsCard({
  email,
}: AccountSettingsCardProps): ReactNode {
  const [emailValue, setEmailValue] = useState(email);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  /**
   * Submits an authenticated email-address change.
   *
   * @param event - The intercepted email form submission.
   * @returns Nothing.
   */
  function changeEmail(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    startTransition(async () => {
      const { error } = await authClient.changeEmail({ newEmail: emailValue });
      if (error) {
        toast.error(t("settings.emailFailed"));
        return;
      }
      router.refresh();
      toast.success(t("settings.emailUpdated"));
    });
  }

  /**
   * Submits a password update after verifying the current password.
   *
   * @param event - The intercepted password form submission.
   * @returns Nothing.
   */
  function changePassword(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error(t("settings.passwordFailed"));
        return;
      }
      form.reset();
      toast.success(t("settings.passwordUpdated"));
    });
  }

  /**
   * Deletes the signed-in account after Better Auth verifies its password.
   *
   * @param formData - The confirmed account-deletion payload.
   * @returns A promise that resolves after the account deletion request finishes.
   */
  async function deleteAccount(formData: FormData): Promise<void> {
    const password = String(formData.get("password") ?? "");
    const { error } = await authClient.deleteUser({ password });
    if (error) {
      toast.error(t("settings.deleteFailed"));
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <section
      aria-busy={isPending}
      className="bg-card shadow-soft h-full rounded-3xl border p-6 sm:p-8"
    >
      <div className="flex items-center gap-4">
        <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">
            {t("settings.credentials")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-5">
            {t("settings.credentialsBody")}
          </p>
        </div>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <form className="rounded-2xl border p-5" onSubmit={changeEmail}>
          <h3 className="flex items-center gap-2 font-bold">
            {t("settings.email")}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("settings.emailBody")}
          </p>
          <label className="mt-4 block text-sm font-bold">
            <span className="mb-2 block">{t("settings.email")}</span>
            <input
              autoComplete="email"
              className="field-input"
              onChange={(event) => setEmailValue(event.target.value)}
              required
              type="email"
              value={emailValue}
            />
          </label>
          <Button
            className="mt-4"
            disabled={isPending || emailValue === email}
            size="sm"
            type="submit"
            variant="secondary"
          >
            {t("settings.saveEmail")}
          </Button>
        </form>
        <form className="rounded-2xl border p-5" onSubmit={changePassword}>
          <h3 className="flex items-center gap-2 font-bold">
            <KeyRound className="size-4" />
            {t("settings.password")}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("settings.passwordBody")}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              <span className="mb-2 block">
                {t("settings.currentPassword")}
              </span>
              <input
                autoComplete="current-password"
                className="field-input"
                name="currentPassword"
                required
                type="password"
              />
            </label>
            <label className="block text-sm font-bold">
              <span className="mb-2 block">{t("settings.newPassword")}</span>
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
          </div>
          <Button
            className="mt-4"
            disabled={isPending}
            size="sm"
            type="submit"
            variant="secondary"
          >
            {t("settings.savePassword")}
          </Button>
        </form>
      </div>
      <div className="border-danger/30 mt-6 flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="bg-danger/10 text-danger grid size-10 shrink-0 place-items-center rounded-xl">
            <TriangleAlert className="size-4" />
          </span>
          <div>
            <h3 className="font-bold">{t("settings.deleteAccount")}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {t("settings.deleteAccountSummary")}
            </p>
          </div>
        </div>
        <ConfirmDialog
          action={deleteAccount}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("settings.deleteAccount")}
          description={t("settings.deleteAccountBody")}
          fields={{}}
          passwordLabel={t("settings.currentPassword")}
          passwordPlaceholder={t("settings.currentPassword")}
          title={t("settings.deleteAccountTitle")}
          trigger={
            <Button
              className="shrink-0"
              size="sm"
              type="button"
              variant="danger"
            >
              <Trash2 className="size-4" />
              {t("settings.deleteAccount")}
            </Button>
          }
        />
      </div>
    </section>
  );
}
