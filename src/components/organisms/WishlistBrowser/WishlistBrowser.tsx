"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { fetchLibraryPage } from "@/client/libraryPages";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { LibraryInfiniteLoader } from "@/components/molecules/LibraryInfiniteLoader/LibraryInfiniteLoader";
import { LibraryControls } from "@/components/organisms/LibraryControls/LibraryControls";
import { WishlistCard } from "@/components/organisms/WishlistCard/WishlistCard";
import type { LibraryFacetGame, LibraryPage, LibraryPageQuery } from "@/core";
import { useLibraryPages } from "@/hooks/useLibraryPages";

/** Wishlist facets, first page, and add-game control rendered by the browser. */
type WishlistBrowserProps = {
  currency: string;
  facetGames: LibraryFacetGame[];
  initialPage: LibraryPage;
  quickAction?: ReactNode;
};

/**
 * Loads one window of the signed-in user's wishlist.
 *
 * @param query - Filter state and result window.
 * @param signal - Cancels the request once a newer view supersedes it.
 * @returns The validated wishlist page.
 */
function loadWishlistPage(
  query: LibraryPageQuery,
  signal: AbortSignal,
): Promise<LibraryPage> {
  return fetchLibraryPage({ ...query, location: "wishlist" }, signal);
}

/**
 * Browses a filtered wishlist that loads further pages while scrolling.
 *
 * @param root0 - Properties that configure wishlist browser.
 * @param root0.currency - The user's display currency.
 * @param root0.facetGames - Lightweight metadata used to populate complete filter choices.
 * @param root0.initialPage - Server-rendered first wishlist page.
 * @param root0.quickAction - Optional add-game trigger for the compact toolbar.
 * @returns The rendered wishlist browser.
 */
export function WishlistBrowser({
  currency,
  facetGames,
  initialPage,
  quickAction,
}: WishlistBrowserProps): ReactNode {
  const t = useTranslations();
  const {
    filters,
    hasFailed,
    hasMore,
    isLoading,
    loadMore,
    page,
    retry,
    setFilters,
  } = useLibraryPages(initialPage, loadWishlistPage);

  return (
    <>
      <LibraryControls
        action={quickAction}
        filters={filters}
        games={facetGames}
        onChange={setFilters}
      />

      {page.games.length > 0 ? (
        <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {page.games.map((game, index) => (
            <WishlistCard
              currency={currency}
              eager={index < 3}
              game={game}
              key={game.id}
            />
          ))}
        </div>
      ) : isLoading ? null : (
        <EmptyState description={t("wishlist.noMatches")} icon={Search} />
      )}

      <LibraryInfiniteLoader
        hasFailed={hasFailed}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
        onRetry={retry}
      />
    </>
  );
}
