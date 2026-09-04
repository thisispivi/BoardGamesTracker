"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { GameFiltersSheet } from "@/components/molecules/GameFiltersSheet/GameFiltersSheet";
import { WishlistCard } from "@/components/organisms/WishlistCard/WishlistCard";
import type { CollectionGame, LibraryFilters } from "@/core";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";

/** Wishlist games and currency rendered by the browser. */
type WishlistBrowserProps = {
  currency: string;
  games: CollectionGame[];
};

/**
 * Fuzzy searchable grid of wishlist games.
 *
 * @param root0 - Properties that configure wishlist browser.
 * @param root0.currency - The user's display currency.
 * @param root0.games - The wishlist games to show.
 * @returns The rendered wishlist browser.
 */
export function WishlistBrowser({
  currency,
  games,
}: WishlistBrowserProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const [filters, setFilters] = useState<LibraryFilters>(createLibraryFilters);
  const visible = useMemo(
    () => filterAndSortLibraryGames(games, filters, locale),
    [filters, games, locale],
  );

  return (
    <>
      <GameFiltersSheet filters={filters} games={games} onChange={setFilters} />

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 items-start gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((game) => (
            <WishlistCard currency={currency} game={game} key={game.id} />
          ))}
        </div>
      ) : (
        <EmptyState description={t("wishlist.noMatches")} icon={Search} />
      )}

      <div aria-hidden="true" className="h-16 md:hidden" />
    </>
  );
}
