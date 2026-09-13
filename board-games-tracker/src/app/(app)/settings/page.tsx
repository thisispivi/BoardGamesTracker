import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookOpen,
  Gift,
  Heart,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { CurrencySelect } from "@/components/molecules/CurrencySelect/CurrencySelect";
import { ProjectLinks } from "@/components/molecules/ProjectLinks/ProjectLinks";
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

/** One library figure printed beside the account identity. */
type LibraryFactProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

/**
 * Prints one library figure above its caption.
 *
 * @param root0 - Properties that configure the figure.
 * @param root0.icon - Pictogram shown beside the caption.
 * @param root0.label - Localized caption for the figure.
 * @param root0.value - Formatted figure, already localized.
 * @returns A labelled figure for the account card.
 */
function LibraryFact({
  icon: Icon,
  label,
  value,
}: LibraryFactProps): ReactNode {
  return (
    <div className="bg-muted/40 flex min-w-0 flex-col-reverse rounded-lg px-3 py-2.5">
      <dt className="text-muted-foreground mt-1 text-[0.6875rem] font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="font-display flex items-center gap-1.5 text-xl font-bold tabular-nums">
        <Icon aria-hidden="true" className="text-primary size-4 shrink-0" />
        {value}
      </dd>
    </div>
  );
}

/**
 * Account and session settings laid out as a bento of equal-height cards.
 *
 * Every row of the grid is filled at each breakpoint, so no card leaves a gap
 * beside it: identity pairs with currency, sharing and account security split
 * the next row, and the two destructive controls sit together beside the
 * portable-data card.
 *
 * @returns The rendered settings page.
 */
export default async function SettingsPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [preferences, t, format, collection] = await Promise.all([
    getUserPreferences(session.user.id),
    getTranslations(),
    getFormatter(),
    getCollection(session.user.id),
  ]);
  const facts = [
    {
      icon: BookOpen,
      label: t("settings.libraryItems"),
      value: format.number(collection.length),
    },
    {
      icon: Heart,
      label: t("settings.libraryFavorites"),
      value: format.number(collection.filter((game) => game.favorite).length),
    },
    {
      icon: Gift,
      label: t("settings.libraryGifts"),
      value: format.number(collection.filter((game) => game.gifted).length),
    },
  ];

  return (
    <>
      <PageHeader
        description={t("settings.description")}
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
      />
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
        <section className="bg-card shadow-soft flex h-full flex-col gap-6 rounded-xl border p-5 sm:p-8 md:col-span-6 xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {facts.map((fact) => (
              <LibraryFact
                icon={fact.icon}
                key={fact.label}
                label={fact.label}
                value={fact.value}
              />
            ))}
          </dl>
          <p className="text-muted-foreground mt-auto flex items-start gap-2 border-t pt-5 text-xs leading-5">
            <ShieldCheck
              aria-hidden="true"
              className="text-primary mt-0.5 size-4 shrink-0"
            />
            {t("settings.session")}
          </p>
        </section>

        <section className="bg-card shadow-soft flex h-full flex-col justify-between gap-6 rounded-xl border p-5 sm:p-8 md:col-span-6 xl:col-span-4">
          <div className="flex items-start gap-4">
            <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-lg">
              <Banknote aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
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

        <SharingCard
          appUrl={env.NEXT_PUBLIC_APP_URL}
          className="md:col-span-6 xl:col-span-5"
          shareCollection={preferences.shareCollection}
          sharePrices={preferences.sharePrices}
          shareToken={preferences.shareToken}
          shareWishlist={preferences.shareWishlist}
        />

        <AccountSettingsCard
          className="md:col-span-6 xl:col-span-7"
          email={session.user.email}
          mailEnabled={isMailConfigured()}
        />

        <UserDataCard className="md:col-span-6 xl:col-span-6" />

        <ClearLibraryCard className="md:col-span-3" library="collection" />

        <ClearLibraryCard className="md:col-span-3" library="wishlist" />

        <section className="bg-card shadow-soft flex h-full flex-col justify-between gap-6 rounded-xl border p-5 sm:p-8 md:col-span-6 xl:col-span-12">
          <div className="flex items-start gap-4">
            <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-lg">
              <Info aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold sm:text-xl">
                {t("settings.about")}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                {t("settings.aboutBody")}
              </p>
            </div>
          </div>
          <ProjectLinks />
        </section>
      </div>
    </>
  );
}
