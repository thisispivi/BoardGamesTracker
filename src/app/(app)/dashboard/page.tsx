import { ArrowRight, Banknote, BookOpen, Heart, Puzzle } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { SectionHeading } from "@/components/atoms/SectionHeading/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { StatGrid } from "@/components/molecules/StatGrid/StatGrid";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";
import { cn } from "@/utils/cn";

/**
 * Personalized collection summary without promotional hero content.
 *
 * @returns The rendered dashboard page.
 */
export default async function DashboardPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [collection, preferences, format, t] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getFormatter(),
    getTranslations(),
  ]);
  const expansions = collection.filter((item) => item.isExpansion);
  const games = collection.filter((item) => !item.isExpansion);
  const favorites = collection.filter((item) => item.favorite).length;
  const totalSpent = collection.reduce(
    (total, item) => total + item.moneySpent,
    0,
  );
  const firstName =
    session.user.name.trim().split(/\s+/)[0] ?? session.user.name;

  return (
    <>
      <PageHeader
        action={
          <Link
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            href="/collection"
          >
            {t("dashboard.openCollection")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
        description={t("dashboard.description")}
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title", { name: firstName })}
      />

      <StatGrid
        className="mb-10 lg:grid-cols-4"
        stats={[
          { icon: BookOpen, label: t("dashboard.games"), value: games.length },
          {
            icon: Puzzle,
            label: t("dashboard.expansions"),
            value: expansions.length,
          },
          { icon: Heart, label: t("dashboard.favorites"), value: favorites },
          {
            icon: Banknote,
            label: t("dashboard.spent"),
            value: format.number(totalSpent, {
              style: "currency",
              currency: preferences.currency,
              maximumFractionDigits: 2,
            }),
          },
        ]}
      />

      <section>
        <SectionHeading
          eyebrow={t("dashboard.collection")}
          meta={
            <Link
              className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-bold transition"
              href="/collection"
            >
              {t("dashboard.viewAll")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          }
          title={t("dashboard.yourGames")}
        />
        {games.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 xl:grid-cols-6">
            {games.slice(0, 6).map((item, index) => (
              <li className="min-w-0" key={item.id}>
                <Link className="group block min-w-0" href="/collection">
                  <GameArtwork
                    className="rounded-lg"
                    eager={index < 2}
                    imageClassName="transition duration-300 group-hover:scale-105"
                    imageUrl={item.imageUrl}
                    name={item.name}
                  />
                  <h3 className="group-hover:text-primary mt-3 truncate text-sm font-bold transition">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {item.minPlayers}–{item.maxPlayers} {t("common.players")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            action={
              <Link
                className={cn(buttonVariants({ size: "sm" }))}
                href="/collection"
              >
                {t("dashboard.addFirst")}
              </Link>
            }
            description={t("dashboard.emptyBody")}
            icon={BookOpen}
            title={t("dashboard.emptyTitle")}
          />
        )}
      </section>
    </>
  );
}
