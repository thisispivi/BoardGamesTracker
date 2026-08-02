"use client";

import { KeyRound, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button/Button";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import { authClient } from "@/utils/authClient";

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
      className="bg-card shadow-soft rounded-3xl border p-6 sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
          <Mail className="size-5" />
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
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form className="space-y-3" onSubmit={changeEmail}>
          <label className="text-sm font-bold" htmlFor="account-email">
            {t("settings.email")}
          </label>
          <input
            id="account-email"
            onChange={(event) => setEmailValue(event.target.value)}
            required
            type="email"
            value={emailValue}
          />
          <Button disabled={isPending} type="submit" variant="secondary">
            {t("settings.saveEmail")}
          </Button>
        </form>
        <form className="space-y-3" onSubmit={changePassword}>
          <p className="flex items-center gap-2 text-sm font-bold">
            <KeyRound className="size-4" />
            {t("settings.password")}
          </p>
          <input
            autoComplete="current-password"
            name="currentPassword"
            placeholder={t("settings.currentPassword")}
            required
            type="password"
          />
          <input
            autoComplete="new-password"
            maxLength={128}
            minLength={12}
            name="newPassword"
            placeholder={t("settings.newPassword")}
            required
            type="password"
          />
          <Button disabled={isPending} type="submit" variant="secondary">
            {t("settings.savePassword")}
          </Button>
        </form>
      </div>
      <div className="mt-7 border-t pt-6">
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
            <Button type="button" variant="danger">
              <Trash2 className="size-4" />
              {t("settings.deleteAccount")}
            </Button>
          }
        />
      </div>
    </section>
  );
}
