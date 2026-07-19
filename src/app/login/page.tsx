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

/** Authentication page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("metaTitle") };
}

/** Direct login and registration page. */
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
    <main className="noise relative grid min-h-screen place-items-center p-5 sm:p-8">
      <div className="absolute top-5 right-5 flex items-center gap-3 sm:top-8 sm:right-8">
        <LocaleSelect />
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="bg-card shadow-soft rounded-3xl border p-6 sm:p-8">
          <AuthForm
            allowSignUp={allowSignUp}
            bootstrapRequired={bootstrapRequired}
            initialMode={mode}
          />
        </div>
      </section>
    </main>
  );
}
