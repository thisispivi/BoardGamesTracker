"use client";

import { BookOpen, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { SectionHeading } from "@/components/atoms/SectionHeading/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { GameFiltersSheet } from "@/components/molecules/GameFiltersSheet/GameFiltersSheet";
import { GameCard } from "@/components/organisms/GameCard/GameCard";
import type { CollectionGame, LibraryFilters } from "@/core";
import { groupCollection } from "@/utils/collectionGrouping";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";

/** Collection data and presentation mode used by the browser. */
type CollectionBrowserProps = {
  currency: string;
  games: CollectionGame[];
  readOnly?: boolean;
};

/**
 * Fuzzy collection search with base-game and expansion grouping.
 *
 * @param root0 - Properties that configure collection browser.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.games - Game records available to the component.
 * @param root0.readOnly - Whether mutation controls must be omitted.
 * @returns The rendered collection browser.
 */
export function CollectionBrowser({
  currency,
  games,
  readOnly = false,
}: CollectionBrowserProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const [filters, setFilters] = useState<LibraryFilters>(createLibraryFilters);
  const visible = useMemo(
    () => filterAndSortLibraryGames(games, filters, locale),
    [filters, games, locale],
  );
  const grouped = useMemo(() => groupCollection(visible), [visible]);
  const expansionCount = visible.filter((game) => game.isExpansion).length;

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
        onChange={setFilters}
        showFavorites
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
          <div className="grid grid-cols-2 items-start gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
            {grouped.groups.map((group, index) => (
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

      {grouped.ungrouped.length > 0 ? (
        <section className="mt-12">
          <SectionHeading
            description={t("collection.otherExpansionsBody")}
            eyebrow={t("collection.addons")}
            title={t("collection.otherExpansions")}
            tone="accent"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {grouped.ungrouped.map((expansion) => (
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

      <div aria-hidden="true" className="h-16 md:hidden" />
    </>
  );
}
