import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { HomeHero } from "@/components/organisms/HomeHero/HomeHero";
import { RecentlyAdded } from "@/components/organisms/RecentlyAdded/RecentlyAdded";
import { ShelfPulse } from "@/components/organisms/ShelfPulse/ShelfPulse";
import { UnplayedRail } from "@/components/organisms/UnplayedRail/UnplayedRail";
import { WishlistSpotlight } from "@/components/organisms/WishlistSpotlight/WishlistSpotlight";
import { getHomeSummary } from "@/server/home";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/**
 * Home page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("navigation.dashboard") };
}

/**
 * Signed-in home built around choosing tonight's game and seeing the shelf at a glance.
 *
 * An empty collection shows only the hero, which then offers ways to add
 * games, plus the wishlist preview when the wishlist already has games.
 *
 * @returns The rendered home page.
 */
export default async function DashboardPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [summary, preferences] = await Promise.all([
    getHomeSummary(session.user.id),
    getUserPreferences(session.user.id),
  ]);
  const firstName =
    session.user.name.trim().split(/\s+/)[0] ?? session.user.name;
  const hasCollection = summary.baseGames + summary.expansions > 0;

  return (
    <>
      <HomeHero
        currency={preferences.currency}
        firstName={firstName}
        summary={summary}
      />

      {hasCollection ? (
        <>
          <ShelfPulse currency={preferences.currency} summary={summary} />
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

      {!hasCollection && summary.wishlistGames > 0 ? (
        <div className="mt-10 max-w-xl">
          <WishlistSpotlight
            count={summary.wishlistGames}
            games={summary.wishlist}
          />
        </div>
      ) : null}
    </>
  );
}
