import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";
import { WishlistBrowser } from "@/components/organisms/WishlistBrowser/WishlistBrowser";
import { getLibraryFacetGames, getLibraryPage } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";
import { createFirstPageQuery } from "@/utils/libraryPages";

/**
 * Wishlist page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("wishlist.metaTitle") };
}

/**
 * Games the signed-in user may want to buy later.
 *
 * @returns The rendered wishlist page.
 */
export default async function WishlistPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [facetGames, initialPage, preferences, t] = await Promise.all([
    getLibraryFacetGames(session.user.id, "wishlist"),
    getLibraryPage(session.user.id, {
      ...createFirstPageQuery(),
      location: "wishlist",
    }),
    getUserPreferences(session.user.id),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        action={
          facetGames.length === 0 ? (
            <AddGameDialog
              currency={preferences.currency}
              destination="wishlist"
            />
          ) : null
        }
        description={t("wishlist.count", { count: facetGames.length })}
        eyebrow={t("wishlist.eyebrow")}
        title={t("wishlist.title")}
      />
      {facetGames.length > 0 ? (
        <WishlistBrowser
          currency={preferences.currency}
          facetGames={facetGames}
          initialPage={initialPage}
          quickAction={
            <AddGameDialog
              currency={preferences.currency}
              destination="wishlist"
            />
          }
        />
      ) : (
        <EmptyState
          description={t("wishlist.emptyBody")}
          icon={ShoppingBag}
          title={t("wishlist.emptyTitle")}
        />
      )}
    </>
  );
}
