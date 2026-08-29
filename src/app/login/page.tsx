import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/atoms/Logo/Logo";
import { LocaleSelect } from "@/components/molecules/LocaleSelect/LocaleSelect";
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle";
import { AuthForm } from "@/components/organisms/AuthForm/AuthForm";
import { env } from "@/env";
import { isBootstrapRequired } from "@/server/bootstrap";
import { getSession } from "@/server/session";

/**
 * Authentication page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("metaTitle") };
}

/**
 * Direct login and registration page.
 *
 * @param root0 - Properties that configure login page.
 * @param root0.searchParams - URL query parameters supplied by Next.js.
 * @returns The rendered login page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const [session, bootstrapRequired] = await Promise.all([
    getSession(),
    isBootstrapRequired(),
  ]);
  if (session) {
    redirect("/dashboard");
  }

  const allowSignUp = bootstrapRequired || env.ALLOW_SIGN_UP;
  const mode =
    bootstrapRequired || (allowSignUp && (await searchParams).mode === "signup")
      ? "signup"
      : "login";

  return (
    <main className="auth-background relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden="true"
        className="noise pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-4 sm:justify-center sm:px-0 sm:py-8">
        <div className="flex justify-end gap-3 sm:fixed sm:top-8 sm:right-8">
          <LocaleSelect />
          <ThemeToggle />
        </div>
        <section className="my-auto py-5 sm:py-8">
          <div className="mb-6 flex justify-center sm:mb-8">
            <Logo />
          </div>
          <div className="bg-card/95 shadow-soft rounded-xl border p-5 backdrop-blur-xl sm:p-8">
            <AuthForm
              allowSignUp={allowSignUp}
              bootstrapRequired={bootstrapRequired}
              initialMode={mode}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
