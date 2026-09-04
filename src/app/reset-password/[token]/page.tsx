import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PasswordResetPanel } from "@/components/molecules/PasswordResetPanel/PasswordResetPanel";
import { ResetPasswordForm } from "@/components/organisms/ResetPasswordForm/ResetPasswordForm";
import { AuthShell } from "@/components/templates/AuthShell/AuthShell";
import { verifyPasswordResetToken } from "@/server/auth/passwordReset";

/** Properties supplied to the tokenized password-reset route. */
type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Password-reset page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reset");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Lets a locked-out account owner choose a new password from a signed link.
 *
 * @param root0 - Properties that configure reset password page.
 * @param root0.params - Dynamic route parameters supplied by Next.js.
 * @returns The rendered reset password page.
 */
export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params;
  const userId = await verifyPasswordResetToken(token);

  return (
    <AuthShell>
      <PasswordResetPanel>
        {userId ? <ResetPasswordForm token={token} /> : null}
      </PasswordResetPanel>
    </AuthShell>
  );
}
