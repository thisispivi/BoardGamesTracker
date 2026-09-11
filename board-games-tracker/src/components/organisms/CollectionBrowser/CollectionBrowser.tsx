"use client";

import { BookOpen, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useCallback, useMemo } from "react";

import { fetchLibraryPage } from "@/client/libraryPages";
import { SectionHeading } from "@/components/atoms/SectionHeading/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { LibraryInfiniteLoader } from "@/components/molecules/LibraryInfiniteLoader/LibraryInfiniteLoader";
import { GameCard } from "@/components/organisms/GameCard/GameCard";
import { LibraryControls } from "@/components/organisms/LibraryControls/LibraryControls";
import type {
  CollectionGame,
  LibraryFacetGame,
  LibraryPage,
  LibraryPageLoader,
} from "@/core";
import { useLibraryPages } from "@/hooks/useLibraryPages";
import { groupCollection } from "@/utils/collectionGrouping";
import {
  createFirstPageQuery,
  paginateLibraryGames,
} from "@/utils/libraryPages";

/**
 * Where collection cards come from.
 *
 * The signed-in account pages its database through the library endpoint. A
 * public share already holds its redacted games in memory and pages them locally,
 * so visitors never reach an authenticated endpoint.
 */
type CollectionSource =
  | {
      facetGames: LibraryFacetGame[];
      initialPage: LibraryPage;
      kind: "private";
    }
  | { games: CollectionGame[]; kind: "shared" };

/** Collection source and optional add-game control used by the browser. */
type CollectionBrowserProps = {
  currency: string;
  quickAction?: ReactNode;
  source: CollectionSource;
};

/**
 * Browses base games with their expansions, loading further pages while scrolling.
 *
 * @param root0 - Properties that configure collection browser.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.quickAction - Optional add-game trigger for the compact toolbar.
 * @param root0.source - Private first page and facets, or the games of a public share, which is read-only.
 * @returns The rendered collection browser.
 */
export function CollectionBrowser({
  currency,
  quickAction,
  source,
}: CollectionBrowserProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const sharedGames = source.kind === "shared" ? source.games : null;
  const serverPage = source.kind === "private" ? source.initialPage : null;
  const facetGames =
    source.kind === "shared" ? source.games : source.facetGames;
  const isReadOnly = sharedGames !== null;
  const initialPage = useMemo(
    () =>
      serverPage ??
      paginateLibraryGames(sharedGames ?? [], createFirstPageQuery(), locale),
    [locale, serverPage, sharedGames],
  );
  const loadPage = useCallback<LibraryPageLoader>(
    (query, signal) =>
      sharedGames
        ? Promise.resolve(paginateLibraryGames(sharedGames, query, locale))
        : fetchLibraryPage({ ...query, location: "collection" }, signal),
    [locale, sharedGames],
  );
  const {
    filters,
    hasFailed,
    hasMore,
    isLoading,
    loadMore,
    page,
    retry,
    setFilters,
  } = useLibraryPages(initialPage, loadPage);
  const grouped = useMemo(() => groupCollection(page.games), [page.games]);

  if (facetGames.length === 0) {
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
      <LibraryControls
        action={quickAction}
        filters={filters}
        games={facetGames}
        onChange={setFilters}
        showFavorites
        showPlayed={!isReadOnly}
      />

      {grouped.groups.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow={t("collection.mainShelf")}
            meta={
              <p className="text-muted-foreground text-sm">
                {t("collection.gameCount", { count: page.baseGameCount })}
                {" · "}
                {t("collection.expansionCount", {
                  count: page.expansionCount,
                })}
              </p>
            }
            title={t("collection.games")}
          />
          <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {grouped.groups.map((group, index) => (
              <GameCard
                currency={currency}
                eager={index < 3}
                expansions={group.expansions}
                game={group.base}
                key={group.base.id}
                readOnly={isReadOnly}
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
          />
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {grouped.ungrouped.map((expansion) => (
              <GameCard
                compact
                currency={currency}
                game={expansion}
                key={expansion.id}
                readOnly={isReadOnly}
              />
            ))}
          </div>
        </section>
      ) : null}

      {page.games.length === 0 && !isLoading ? (
        <EmptyState description={t("collection.noMatches")} icon={Search} />
      ) : null}

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
