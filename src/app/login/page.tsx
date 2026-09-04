import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AuthForm } from "@/components/organisms/AuthForm/AuthForm";
import { AuthShell } from "@/components/templates/AuthShell/AuthShell";
import { env } from "@/env";
import { isBootstrapRequired } from "@/server/bootstrap";
import { isMailConfigured } from "@/server/mail/config";
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
}): Promise<ReactNode> {
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
    <AuthShell>
      <div className="bg-card/95 shadow-soft rounded-xl border p-5 backdrop-blur-xl sm:p-8">
        <AuthForm
          allowSignUp={allowSignUp}
          bootstrapRequired={bootstrapRequired}
          initialMode={mode}
          mailEnabled={isMailConfigured()}
        />
      </div>
    </AuthShell>
  );
}
