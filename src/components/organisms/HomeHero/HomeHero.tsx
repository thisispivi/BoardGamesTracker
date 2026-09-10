import { Dices, Library } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/atoms/Button/Button";
import { CoverFan } from "@/components/molecules/CoverFan/CoverFan";
import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";
import { ImportCollectionDialog } from "@/components/organisms/ImportCollectionDialog/ImportCollectionDialog";
import type { HomeSummary } from "@/core";
import { cn } from "@/utils/cn";

/** Greeting name, currency, and library snapshot shown in the home hero. */
type HomeHeroProps = {
  currency: string;
  firstName: string;
  summary: HomeSummary;
};

/**
 * Opens the home page with a question about tonight's game and the shelf's covers.
 *
 * An empty shelf swaps the picker and collection links for the two ways to
 * start one: adding a game by name or importing a BoardGameGeek export.
 *
 * @param root0 - Properties that configure the home hero.
 * @param root0.currency - ISO currency code preselected when adding a game.
 * @param root0.firstName - Name used in the greeting.
 * @param root0.summary - Library snapshot supplying counts and covers.
 * @returns The home hero section.
 */
export function HomeHero({
  currency,
  firstName,
  summary,
}: HomeHeroProps): ReactNode {
  const t = useTranslations("dashboard");
  const isEmpty = summary.baseGames + summary.expansions === 0;

  return (
    <section className="bg-card relative isolate grid gap-10 overflow-hidden rounded-xl border px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_45%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_55%),radial-gradient(circle_at_100%_100%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_45%)]"
      />
      <div className="max-w-xl">
        <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
          {isEmpty
            ? t("emptyTitle", { name: firstName })
            : t("title", { name: firstName })}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-[46ch] text-base sm:text-lg">
          {isEmpty
            ? t("emptyBody")
            : t("summary", {
                games: summary.baseGames,
                unplayed: summary.baseGames - summary.playedBaseGames,
              })}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {isEmpty ? (
            <>
              <AddGameDialog currency={currency} />
              <ImportCollectionDialog />
            </>
          ) : (
            <>
              <Link className={cn(buttonVariants({ size: "lg" }))} href="/play">
                <Dices aria-hidden="true" className="size-5" />
                {t("pickGame")}
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                )}
                href="/collection"
              >
                {t("openCollection")}
              </Link>
            </>
          )}
        </div>
      </div>
      {isEmpty ? (
        <div
          aria-hidden="true"
          className="text-primary hidden h-64 place-items-center rounded-xl border border-dashed lg:grid"
        >
          <Library className="size-16 opacity-60" />
        </div>
      ) : (
        <CoverFan games={summary.showcase} label={t("showcase")} />
      )}
    </section>
  );
}
