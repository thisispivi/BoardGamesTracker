import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

/** Friendly application-wide 404 response. */
export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="noise grid min-h-screen place-items-center p-6">
      <div className="max-w-lg text-center">
        <Logo className="mb-10 justify-center" />
        <p className="text-primary text-sm font-bold tracking-[0.2em] uppercase">
          {t("notFound.eyebrow")}
        </p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">
          {t("notFound.title")}
        </h1>
        <p className="text-muted-foreground mt-5">{t("notFound.body")}</p>
        <Link className={`${buttonVariants({ size: "lg" })} mt-8`} href="/">
          {t("notFound.home")}
        </Link>
      </div>
    </main>
  );
}
