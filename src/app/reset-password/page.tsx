import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PasswordResetPanel } from "@/components/molecules/PasswordResetPanel/PasswordResetPanel";
import { MailResetPasswordForm } from "@/components/organisms/MailResetPasswordForm/MailResetPasswordForm";
import { AuthShell } from "@/components/templates/AuthShell/AuthShell";

/** Query values accepted from Better Auth's reset redirect. */
type MailResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    token?: string | string[];
  }>;
};

/**
 * Returns localized metadata for the emailed password-reset page.
 *
 * @returns Metadata that prevents recovery links from being indexed.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reset");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Lets an account owner choose a new password from an SMTP-delivered link.
 *
 * @param root0 - Route properties.
 * @param root0.searchParams - Better Auth token or failure details.
 * @returns The rendered recovery page.
 */
export default async function MailResetPasswordPage({
  searchParams,
}: MailResetPasswordPageProps) {
  const parameters = await searchParams;
  const token =
    typeof parameters.token === "string" && !parameters.error
      ? parameters.token
      : null;

  return (
    <AuthShell>
      <PasswordResetPanel>
        {token ? <MailResetPasswordForm token={token} /> : null}
      </PasswordResetPanel>
    </AuthShell>
  );
}
