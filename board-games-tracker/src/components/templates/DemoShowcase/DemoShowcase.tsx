"use client";

import english from "@messages/en.json";
import italian from "@messages/it.json";
import {
  BookOpen,
  ChartNoAxesCombined,
  Dices,
  House,
  type LucideIcon,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { Logo } from "@/components/atoms/Logo/Logo";
import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle";
import { CollectionStatistics } from "@/components/organisms/CollectionStatistics/CollectionStatistics";
import { DemoLibraryBrowser } from "@/components/organisms/DemoLibraryBrowser/DemoLibraryBrowser";
import { GamePicker } from "@/components/organisms/GamePicker/GamePicker";
import { HomeHero } from "@/components/organisms/HomeHero/HomeHero";
import { RecentlyAdded } from "@/components/organisms/RecentlyAdded/RecentlyAdded";
import { ShelfPulse } from "@/components/organisms/ShelfPulse/ShelfPulse";
import { UnplayedRail } from "@/components/organisms/UnplayedRail/UnplayedRail";
import { WishlistSpotlight } from "@/components/organisms/WishlistSpotlight/WishlistSpotlight";
import { Providers } from "@/components/templates/Providers/Providers";
import type { DemoLibrary, DemoView } from "@/core";
import { type AppLocale, isLocale } from "@/i18n/config";
import { cn } from "@/utils/cn";
import { demoNow, summarizeDemoLibrary } from "@/utils/demoLibrary";

/** Static deployment prefix, fictional library, and selected public page. */
type DemoShowcaseProps = {
  basePath: string;
  library: DemoLibrary;
  view: DemoView;
};

/**
 * Provides the public demo's client-side language and theme preferences.
 *
 * @param root0 - Static deployment and fictional account data.
 * @param root0.basePath - GitHub Pages asset prefix.
 * @param root0.library - Fictional account data without credentials.
 * @param root0.view - Selected showcase page.
 * @returns The showcase with locally switchable language and theme.
 */
export function DemoShowcase({
  basePath,
  library,
  view,
}: DemoShowcaseProps): ReactNode {
  const [locale, setLocale] = useState<AppLocale>("en");
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "it" ? italian : english}
      now={demoNow}
      timeZone="Europe/Berlin"
    >
      <Providers initialTheme="light" nonce={undefined}>
        <DemoContent
          basePath={basePath}
          languageControl={
            <select
              aria-label={
                locale === "it" ? italian.demo.language : english.demo.language
              }
              className="bg-card rounded-lg border px-3 py-2 text-sm"
              onChange={(event) => {
                if (isLocale(event.target.value)) setLocale(event.target.value);
              }}
              value={locale}
            >
              <option value="en">English</option>
              <option value="it">Italiano</option>
            </select>
          }
          library={library}
          view={view}
        />
      </Providers>
    </NextIntlClientProvider>
  );
}

/** Demo shell properties with the local language selector. */
type DemoContentProps = DemoShowcaseProps & { languageControl: ReactNode };

/** Navigation entry restricted to the static demo's known pages. */
type DemoNavigationLink = { href: string; icon: LucideIcon; key: DemoView };

/**
 * Renders real product components around a clearly identified fictional account.
 *
 * @param root0 - Public showcase content.
 * @param root0.basePath - GitHub Pages asset prefix.
 * @param root0.languageControl - Local language preference control.
 * @param root0.library - Fictional account data without credentials.
 * @param root0.view - Page selected by the static route.
 * @returns The responsive navigation and selected product page.
 */
function DemoContent({
  basePath,
  languageControl,
  library,
  view,
}: DemoContentProps): ReactNode {
  const t = useTranslations();
  const summary = summarizeDemoLibrary(library);
  const links: DemoNavigationLink[] = [
    { href: "/dashboard", icon: House, key: "dashboard" },
    { href: "/collection", icon: BookOpen, key: "collection" },
    { href: "/wishlist", icon: ShoppingBag, key: "wishlist" },
    { href: "/play", icon: Dices, key: "play" },
    { href: "/stats", icon: ChartNoAxesCombined, key: "stats" },
  ];
  const navigation = (
    <nav
      aria-label={t("nav.primary")}
      className="flex flex-wrap gap-1 lg:mt-12 lg:block lg:space-y-1"
    >
      {links.map((link) => (
        <Link
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition",
            view === link.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          href={link.href}
          key={link.key}
        >
          <link.icon className="size-4.5" />
          <span>{t(`navigation.${link.key}`)}</span>
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="bg-background min-h-screen w-full max-w-full overflow-x-clip lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="bg-card sticky top-0 hidden h-screen flex-col border-r px-5 py-6 lg:flex">
        <Logo assetBasePath={basePath} className="px-2" />
        {navigation}
        <div className="mt-auto space-y-4">
          <p className="text-primary text-sm font-bold">{t("demo.title")}</p>
          <p className="text-muted-foreground text-xs leading-5">
            {t("demo.description")}
          </p>
          <div className="flex items-center gap-2">
            {languageControl}
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 border-t pt-5">
            <Avatar name="Alex Morgan" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Alex Morgan</p>
              <p className="text-muted-foreground truncate text-xs">
                alex@example.invalid
              </p>
            </div>
          </div>
          <a
            className="text-primary text-sm font-semibold underline underline-offset-4"
            href="https://github.com/thisispivi/BoardGamesTracker"
            rel="noreferrer"
            target="_blank"
          >
            {t("demo.source")}
          </a>
        </div>
      </aside>
      <div className="isolate max-w-full min-w-0 overflow-x-clip">
        <header className="bg-card space-y-3 border-b p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Logo assetBasePath={basePath} /> <ThemeToggle />
          </div>
          {navigation}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {t("demo.title")} · Alex Morgan
            </span>
            {languageControl}
          </div>
        </header>
        <main className="w-full min-w-0 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          {view === "dashboard" ? (
            <>
              <HomeHero firstName="Alex" summary={summary} />
              <ShelfPulse currency="EUR" summary={summary} />
              <UnplayedRail games={summary.unplayed} />
              <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <RecentlyAdded items={summary.recentlyAdded} />
                <WishlistSpotlight
                  count={summary.wishlistGames}
                  games={summary.wishlist}
                />
              </div>
            </>
          ) : null}
          {view === "collection" || view === "wishlist" ? (
            <>
              <PageHeader
                description={t(`${view}.count`, {
                  count: library[view].length,
                })}
                eyebrow={t(`${view}.eyebrow`)}
                title={t(`${view}.title`)}
              />
              <DemoLibraryBrowser
                games={library[view]}
                key={view}
                wishlist={view === "wishlist"}
              />
            </>
          ) : null}
          {view === "play" ? (
            <>
              <PageHeader
                description={t("play.description")}
                eyebrow={t("play.eyebrow")}
                title={t("play.title")}
              />
              <GamePicker games={library.collection} />
            </>
          ) : null}
          {view === "stats" ? (
            <CollectionStatistics
              collection={library.collection}
              currency="EUR"
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
