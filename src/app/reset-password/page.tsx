import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/atoms/Logo/Logo";
import { MailResetPasswordForm } from "@/components/organisms/MailResetPasswordForm/MailResetPasswordForm";

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
  const t = await getTranslations();
  return {
    title: t("reset.metaTitle"),
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
  const [parameters, t] = await Promise.all([searchParams, getTranslations()]);
  const token =
    typeof parameters.token === "string" && !parameters.error
      ? parameters.token
      : null;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-4 py-12">
      <div className="w-full">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <section className="bg-card shadow-soft rounded-xl border p-6 sm:p-8">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {t("reset.eyebrow")}
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold">
            {t("reset.title")}
          </h1>
          {token ? (
            <>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {t("reset.body")}
              </p>
              <MailResetPasswordForm token={token} />
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
