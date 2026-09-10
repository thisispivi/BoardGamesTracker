"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { GameFiltersSheet } from "@/components/molecules/GameFiltersSheet/GameFiltersSheet";
import { LibraryPagination } from "@/components/molecules/LibraryPagination/LibraryPagination";
import { LibraryToolbar } from "@/components/molecules/LibraryToolbar/LibraryToolbar";
import { WishlistCard } from "@/components/organisms/WishlistCard/WishlistCard";
import type { CollectionGame, LibraryFilters } from "@/core";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";
import { paginateLibraryEntries } from "@/utils/libraryPagination";

/** Wishlist games and currency rendered by the browser. */
type WishlistBrowserProps = {
  currency: string;
  games: CollectionGame[];
  quickAction?: ReactNode;
};

/** Number of wishlist entries revealed in each batch. */
const libraryPageSize = 50;

/**
 * Fuzzy searchable grid of wishlist games.
 *
 * @param root0 - Properties that configure wishlist browser.
 * @param root0.currency - The user's display currency.
 * @param root0.games - The wishlist games to show.
 * @param root0.quickAction - Optional compact add-game trigger for the sticky toolbar.
 * @returns The rendered wishlist browser.
 */
export function WishlistBrowser({
  currency,
  games,
  quickAction,
}: WishlistBrowserProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const [filters, setFilters] = useState<LibraryFilters>(createLibraryFilters);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(libraryPageSize);
  const visible = useMemo(
    () => filterAndSortLibraryGames(games, filters, locale),
    [filters, games, locale],
  );
  const page = paginateLibraryEntries(visible, [], visibleLimit);

  /**
   * Applies new filters and starts progressive rendering from its first batch.
   *
   * @param nextFilters - Complete controlled filter state from either surface.
   * @returns Nothing.
   */
  function changeFilters(nextFilters: LibraryFilters): void {
    setFilters(nextFilters);
    setVisibleLimit(libraryPageSize);
  }

  return (
    <>
      <GameFiltersSheet
        filters={filters}
        games={games}
        onChange={changeFilters}
        onOpenChange={setFilterSheetOpen}
        open={filterSheetOpen}
      />

      <LibraryToolbar
        action={quickAction}
        filters={filters}
        onOpenFilters={() => setFilterSheetOpen(true)}
        onQueryChange={(query) => changeFilters({ ...filters, query })}
      />

      {visible.length > 0 ? (
        <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {page.primary.map((game, index) => (
            <WishlistCard
              currency={currency}
              eager={index < 3}
              game={game}
              key={game.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState description={t("wishlist.noMatches")} icon={Search} />
      )}

      {visible.length > 0 ? (
        <LibraryPagination
          onLoadMore={() =>
            setVisibleLimit((current) => current + libraryPageSize)
          }
          shown={page.shown}
          total={page.total}
        />
      ) : null}
    </>
  );
}
