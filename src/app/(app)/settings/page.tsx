import {
  Banknote,
  Boxes,
  Gift,
  Heart,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";

import { ClearCollectionCard } from "@/components/clear-collection-card";
import { CurrencySelect } from "@/components/currency-select";
import { PageHeader } from "@/components/page-header";
import { UserDataCard } from "@/components/user-data-card";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/session";
import { getUserPreferences } from "@/server/preferences";
import { getCollection } from "@/server/collection";

/** Settings page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("settings.metaTitle") };
}

/** Account and session settings for the signed-in user. */
export default async function SettingsPage() {
  const session = await requireUser();
  const [preferences, t, collection] = await Promise.all([
    getUserPreferences(session.user.id),
    getTranslations(),
    getCollection(session.user.id),
  ]);
  const initials = session.user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const collectionFacts = [
    {
      icon: Boxes,
      label: t("settings.libraryItems"),
      value: collection.length,
    },
    {
      icon: Heart,
      label: t("settings.libraryFavorites"),
      value: collection.filter((game) => game.favorite).length,
    },
    {
      icon: Gift,
      label: t("settings.libraryGifts"),
      value: collection.filter((game) => game.gifted).length,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        description={t("settings.description")}
      />
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <section className="bg-card shadow-soft relative overflow-hidden rounded-4xl border p-6 sm:p-8 lg:col-span-2">
          <div
            className="bg-primary/8 pointer-events-none absolute -top-20 -right-16 size-72 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="flex items-center gap-4">
                <span className="from-primary to-primary/70 text-primary-foreground font-display grid size-16 shrink-0 place-items-center rounded-3xl bg-linear-to-br text-xl font-black shadow-lg">
                  {initials || <UserRound className="size-6" />}
                </span>
                <div className="min-w-0">
                  <p className="text-primary text-xs font-bold tracking-widest uppercase">
                    {t("settings.account")}
                  </p>
                  <h2 className="font-display mt-1 truncate text-2xl font-bold">
                    {session.user.name}
                  </h2>
                  <p className="text-muted-foreground truncate text-sm">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <span className="bg-primary/10 text-primary flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize">
                <ShieldCheck className="size-3.5" /> {session.user.role}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {collectionFacts.map((fact) => (
                <article
                  key={fact.label}
                  className="bg-background/75 rounded-2xl border p-3 backdrop-blur sm:p-4"
                >
                  <fact.icon className="text-primary size-4" />
                  <p className="font-display mt-4 text-2xl font-bold tabular-nums">
                    {fact.value}
                  </p>
                  <p className="text-muted-foreground mt-1 truncate text-[0.68rem] font-semibold sm:text-xs">
                    {fact.label}
                  </p>
                </article>
              ))}
            </div>
            <p className="text-muted-foreground flex items-start gap-2 border-t pt-5 text-xs leading-5">
              <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
              {t("settings.session")}
            </p>
          </div>
        </section>
        <section className="bg-card shadow-soft relative overflow-hidden rounded-3xl border p-6 sm:p-8">
          <div
            className="bg-primary/7 absolute -right-12 -bottom-16 size-56 rounded-full blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex h-full flex-col justify-between gap-7">
            <div className="flex items-start gap-4">
              <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
                <Banknote className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {t("settings.currency")}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-5">
                  {t("settings.currencyBody")}
                </p>
              </div>
            </div>
            <CurrencySelect initialCurrency={preferences.currency} />
          </div>
        </section>
        <ClearCollectionCard />
        <div className="lg:col-span-2">
          <UserDataCard />
        </div>
      </div>
    </>
  );
}
