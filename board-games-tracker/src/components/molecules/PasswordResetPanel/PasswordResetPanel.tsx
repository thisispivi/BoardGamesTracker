import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

/** Recovery form to render, or nothing when the recovery link is no longer valid. */
type PasswordResetPanelProps = {
  children: ReactNode;
};

/**
 * Frames either password-recovery form, or explains that the link has expired.
 *
 * @param root0 - Properties that configure password reset panel.
 * @param root0.children - Recovery form, or null once the link is unusable.
 * @returns The rendered recovery card.
 */
export async function PasswordResetPanel({
  children,
}: PasswordResetPanelProps): Promise<ReactNode> {
  const t = await getTranslations("reset");

  return (
    <div className="bg-card/95 shadow-soft rounded-xl border p-5 backdrop-blur-xl sm:p-8">
      <p className="text-primary text-xs font-bold tracking-widest uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-1 text-2xl font-bold">{t("title")}</h1>
      {children ? (
        <>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {t("body")}
          </p>
          {children}
        </>
      ) : (
        <>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {t("expired")}
          </p>
          <Link
            className="text-primary mt-6 inline-block text-sm font-bold hover:underline"
            href="/login"
          >
            {t("backToLogin")}
          </Link>
        </>
      )}
    </div>
  );
}
