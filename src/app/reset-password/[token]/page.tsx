import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/atoms/Logo/Logo";
import { ResetPasswordForm } from "@/components/organisms/ResetPasswordForm/ResetPasswordForm";
import { verifyPasswordResetToken } from "@/server/auth/passwordReset";

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Password-reset page metadata.
 *
 * @returns The documented function result.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("reset.metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Lets a locked-out account owner choose a new password from a signed link.
 *
 * @param root0 - Component or function properties.
 * @param root0.params - The 'params' property.
 * @returns The documented function result.
 */
export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const [{ token }, t] = await Promise.all([params, getTranslations()]);
  const userId = await verifyPasswordResetToken(token);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-4 py-12">
      <div className="w-full">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <section className="bg-card shadow-soft rounded-3xl border p-6 sm:p-8">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {t("reset.eyebrow")}
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold">
            {t("reset.title")}
          </h1>
          {userId ? (
            <>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {t("reset.body")}
              </p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {t("reset.expired")}
              </p>
              <Link
                className="text-primary mt-6 inline-block text-sm font-bold hover:underline"
                href="/login"
              >
                {t("reset.backToLogin")}
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
