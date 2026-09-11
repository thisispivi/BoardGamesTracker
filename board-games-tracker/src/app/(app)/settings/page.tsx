import {
  Banknote,
  BookOpen,
  Gift,
  Heart,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { CurrencySelect } from "@/components/molecules/CurrencySelect/CurrencySelect";
import { ProjectLinks } from "@/components/molecules/ProjectLinks/ProjectLinks";
import { StatGrid } from "@/components/molecules/StatGrid/StatGrid";
import { AccountSettingsCard } from "@/components/organisms/AccountSettingsCard/AccountSettingsCard";
import { ClearLibraryCard } from "@/components/organisms/ClearLibraryCard/ClearLibraryCard";
import { SharingCard } from "@/components/organisms/SharingCard/SharingCard";
import { UserDataCard } from "@/components/organisms/UserDataCard/UserDataCard";
import { env } from "@/env";
import { getCollection } from "@/server/collection";
import { isMailConfigured } from "@/server/mail/config";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/**
 * Settings page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("settings.metaTitle") };
}

/**
 * Account and session settings for the signed-in user.
 *
 * @returns The rendered settings page.
 */
export default async function SettingsPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [preferences, t, collection] = await Promise.all([
    getUserPreferences(session.user.id),
    getTranslations(),
    getCollection(session.user.id),
  ]);
  const collectionFacts = [
    {
      icon: BookOpen,
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
        description={t("settings.description")}
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
      />
      <div className="min-w-0 space-y-5">
        <section>
          <div className="bg-card shadow-soft rounded-xl border p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-14 text-lg" name={session.user.name} />
                <div className="min-w-0">
                  <p className="text-primary text-xs font-bold tracking-[0.18em] uppercase">
                    {t("settings.account")}
                  </p>
                  <h2 className="font-display mt-1 truncate text-xl font-bold sm:text-2xl">
                    {session.user.name}
                  </h2>
                  <p className="text-muted-foreground truncate text-sm">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <span className="bg-muted text-foreground flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                {session.user.role}
              </span>
            </div>
            <p className="text-muted-foreground mt-7 flex items-start gap-2 border-t pt-5 text-xs leading-5">
              <ShieldCheck
                aria-hidden="true"
                className="text-primary mt-0.5 size-4 shrink-0"
              />
              {t("settings.session")}
            </p>
          </div>
          <StatGrid className="mt-5 grid-cols-3" stats={collectionFacts} />
        </section>
        <SharingCard
          appUrl={env.NEXT_PUBLIC_APP_URL}
          shareCollection={preferences.shareCollection}
          sharePrices={preferences.sharePrices}
          shareToken={preferences.shareToken}
          shareWishlist={preferences.shareWishlist}
        />
        <AccountSettingsCard
          email={session.user.email}
          mailEnabled={isMailConfigured()}
        />
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <section className="bg-card shadow-soft flex flex-col justify-between gap-7 rounded-xl border p-5 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-md">
                <Banknote aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold sm:text-xl">
                  {t("settings.currency")}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-5">
                  {t("settings.currencyBody")}
                </p>
              </div>
            </div>
            <CurrencySelect initialCurrency={preferences.currency} />
          </section>
          <ClearLibraryCard library="collection" />
          <ClearLibraryCard library="wishlist" />
        </div>
        <UserDataCard />
        <section className="bg-card shadow-soft rounded-xl border p-5 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-md">
              <Info aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold sm:text-xl">
                {t("settings.about")}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                {t("settings.aboutBody")}
              </p>
            </div>
          </div>
          <ProjectLinks className="mt-7" />
        </section>
      </div>
    </>
  );
}
