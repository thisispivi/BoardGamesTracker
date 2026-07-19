import { ArrowRight, Banknote, BookOpen, Boxes, Heart } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";
import { cn } from "@/utils/cn";

/**
 * Personalized collection summary without promotional hero content.
 *
 * @returns The documented function result.
 */
export default async function DashboardPage() {
  const session = await requireUser();
  const [collection, preferences, format, t] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getFormatter(),
    getTranslations(),
  ]);
  const expansions = collection.filter((item) => item.isExpansion);
  const games = collection.filter((item) => !expansions.includes(item));
  const favorites = collection.filter((item) => item.favorite).length;
  const totalSpent = collection.reduce(
    (total, item) => total + item.moneySpent,
    0,
  );
  const firstName =
    session.user.name.trim().split(/\s+/)[0] ?? session.user.name;

  return (
    <>
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {t("dashboard.eyebrow")}
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {t("dashboard.title", { name: firstName })}
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            {t("dashboard.description")}
          </p>
        </div>
        <Link
          className="text-primary hover:bg-primary/10 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition"
          href="/collection"
        >
          {t("dashboard.openCollection")} <ArrowRight className="size-4" />
        </Link>
      </header>

      <section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("dashboard.games"), value: games.length, icon: BookOpen },
          {
            label: t("dashboard.expansions"),
            value: expansions.length,
            icon: Boxes,
          },
          { label: t("dashboard.favorites"), value: favorites, icon: Heart },
          {
            label: t("dashboard.spent"),
            value: format.number(totalSpent, {
              style: "currency",
              currency: preferences.currency,
              maximumFractionDigits: 2,
            }),
            icon: Banknote,
          },
        ].map((stat, index) => (
          <article
            className="bg-card shadow-soft hover:border-primary/35 group rounded-2xl border p-5 transition duration-300 hover:-translate-y-1"
            key={stat.label}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl transition duration-300 group-hover:scale-105 group-hover:rotate-3">
              <stat.icon className="size-4.5" />
            </span>
            <p className="font-display mt-6 truncate text-2xl font-bold sm:text-3xl">
              {stat.value}
            </p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-card rounded-3xl border p-5 sm:p-7">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase">
              {t("dashboard.collection")}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold">
              {t("dashboard.yourGames")}
            </h2>
          </div>
          <Link
            className="text-primary flex items-center gap-2 text-sm font-bold"
            href="/collection"
          >
            {t("dashboard.viewAll")} <ArrowRight className="size-4" />
          </Link>
        </div>
        {games.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {games.slice(0, 6).map((item, index) => (
              <Link
                className="group bg-background min-w-0 rounded-2xl border p-2 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                href="/collection"
                key={item.id}
              >
                <GameArtwork
                  className="rounded-md"
                  eager={index < 2}
                  imageUrl={item.imageUrl}
                  name={item.name}
                />
                <h3 className="mt-3 truncate px-1 text-sm font-bold">
                  {item.name}
                </h3>
                <p className="text-muted-foreground mt-1 px-1 pb-1 text-xs">
                  {item.minPlayers}–{item.maxPlayers} {t("common.players")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <BookOpen className="text-primary mx-auto size-8" />
            <h3 className="font-display mt-4 text-xl font-bold">
              {t("dashboard.emptyTitle")}
            </h3>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
              {t("dashboard.emptyBody")}
            </p>
            <Link
              className={cn(buttonVariants({ size: "sm" }), "mt-5")}
              href="/collection"
            >
              {t("dashboard.addFirst")}
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
