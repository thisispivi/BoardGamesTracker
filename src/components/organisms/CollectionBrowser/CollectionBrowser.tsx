"use client";

import { BookOpen, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { SectionHeading } from "@/components/atoms/SectionHeading/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { GameFiltersSheet } from "@/components/molecules/GameFiltersSheet/GameFiltersSheet";
import { LibraryPagination } from "@/components/molecules/LibraryPagination/LibraryPagination";
import { LibraryToolbar } from "@/components/molecules/LibraryToolbar/LibraryToolbar";
import { GameCard } from "@/components/organisms/GameCard/GameCard";
import type { CollectionGame, LibraryFilters } from "@/core";
import { groupCollection } from "@/utils/collectionGrouping";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";
import { paginateLibraryEntries } from "@/utils/libraryPagination";

/** Collection data and presentation mode used by the browser. */
type CollectionBrowserProps = {
  currency: string;
  games: CollectionGame[];
  quickAction?: ReactNode;
  readOnly?: boolean;
};

/** Number of top-level library entries revealed in each batch. */
const libraryPageSize = 50;

/**
 * Fuzzy collection search with base-game and expansion grouping.
 *
 * @param root0 - Properties that configure collection browser.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.games - Game records available to the component.
 * @param root0.quickAction - Optional compact add-game trigger for the sticky toolbar.
 * @param root0.readOnly - Whether mutation controls must be omitted.
 * @returns The rendered collection browser.
 */
export function CollectionBrowser({
  currency,
  games,
  quickAction,
  readOnly = false,
}: CollectionBrowserProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const [filters, setFilters] = useState<LibraryFilters>(createLibraryFilters);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(libraryPageSize);
  const visible = useMemo(
    () => filterAndSortLibraryGames(games, filters, locale),
    [filters, games, locale],
  );
  const grouped = useMemo(() => groupCollection(visible), [visible]);
  const page = paginateLibraryEntries(
    grouped.groups,
    grouped.ungrouped,
    visibleLimit,
  );
  const expansionCount = visible.filter((game) => game.isExpansion).length;

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

  if (games.length === 0) {
    return (
      <EmptyState
        description={t("collection.emptyBody")}
        icon={BookOpen}
        title={t("collection.emptyTitle")}
      />
    );
  }

  return (
    <>
      <GameFiltersSheet
        filters={filters}
        games={games}
        onChange={changeFilters}
        onOpenChange={setFilterSheetOpen}
        open={filterSheetOpen}
        showFavorites
        showPlayed={!readOnly}
      />

      <LibraryToolbar
        action={quickAction}
        filters={filters}
        onOpenFilters={() => setFilterSheetOpen(true)}
        onQueryChange={(query) => changeFilters({ ...filters, query })}
        showFavorites
        showPlayed={!readOnly}
      />

      {visible.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow={t("collection.mainShelf")}
            meta={
              <p className="text-muted-foreground text-sm">
                {t("collection.gameCount", { count: grouped.groups.length })}
                {" · "}
                {t("collection.expansionCount", { count: expansionCount })}
              </p>
            }
            title={t("collection.games")}
          />
          <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {page.primary.map((group, index) => (
              <GameCard
                currency={currency}
                eager={index < 3}
                expansions={group.expansions}
                game={group.base}
                key={group.base.id}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ) : null}

      {page.secondary.length > 0 ? (
        <section className="mt-12">
          <SectionHeading
            description={t("collection.otherExpansionsBody")}
            eyebrow={t("collection.addons")}
            title={t("collection.otherExpansions")}
          />
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {page.secondary.map((expansion) => (
              <GameCard
                compact
                currency={currency}
                game={expansion}
                key={expansion.id}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState description={t("collection.noMatches")} icon={Search} />
      ) : null}

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
