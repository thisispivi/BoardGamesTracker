import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/atoms/Button/Button";
import { AuthShell } from "@/components/templates/AuthShell/AuthShell";
import { cn } from "@/utils/cn";

/**
 * Friendly application-wide 404 response.
 *
 * @returns The rendered not found.
 */
export default async function NotFound(): Promise<ReactNode> {
  const t = await getTranslations("notFound");
  return (
    <AuthShell className="max-w-lg text-center">
      <p className="text-primary text-sm font-bold tracking-[0.2em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <p className="text-muted-foreground mt-5">{t("body")}</p>
      <Link className={cn(buttonVariants({ size: "lg" }), "mt-8")} href="/">
        {t("home")}
      </Link>
    </AuthShell>
  );
}
