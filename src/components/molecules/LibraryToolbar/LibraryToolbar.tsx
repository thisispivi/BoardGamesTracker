"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { LibraryFilters } from "@/core";
import { countActiveFilters } from "@/utils/libraryFilters";

/** Search, filter state, and optional mutation rendered above library results. */
type LibraryToolbarProps = {
  action?: ReactNode;
  filters: LibraryFilters;
  onOpenFilters: () => void;
  onQueryChange: (query: string) => void;
  showFavorites?: boolean;
  showPlayed?: boolean;
};

/**
 * Keeps the essential library controls reachable while results scroll.
 *
 * @param root0 - Properties that configure the compact browsing toolbar.
 * @param root0.action - Optional add-game control omitted from read-only libraries.
 * @param root0.filters - Current state used for search and the active-filter badge.
 * @param root0.onOpenFilters - Callback that opens the responsive filter sheet.
 * @param root0.onQueryChange - Callback receiving the next search query.
 * @param root0.showFavorites - Whether favorite status contributes to the badge.
 * @param root0.showPlayed - Whether played status contributes to the badge.
 * @returns A sticky, keyboard-accessible toolbar.
 */
export function LibraryToolbar({
  action,
  filters,
  onOpenFilters,
  onQueryChange,
  showFavorites = false,
  showPlayed = false,
}: LibraryToolbarProps): ReactNode {
  const t = useTranslations("libraryFilters");
  const activeFilterCount = countActiveFilters(filters, {
    favorites: showFavorites,
    played: showPlayed,
    query: true,
  });

  return (
    <section
      aria-label={t("quickControls")}
      className="bg-background/92 sticky top-18 z-10 mb-6 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-y py-3 backdrop-blur-md lg:top-0"
    >
      <label className="relative block min-w-0">
        <span className="sr-only">{t("searchLabel")}</span>
        <Search
          aria-hidden="true"
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          className="bg-card focus-visible:border-primary/50 h-10 w-full rounded-lg border pr-3 pl-9 text-sm shadow-sm"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={filters.query}
        />
      </label>
      <button
        aria-label={t("openFilters")}
        className="bg-card hover:bg-muted relative flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold shadow-sm transition-colors"
        onClick={onOpenFilters}
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{t("filters")}</span>
        {activeFilterCount > 0 ? (
          <span className="bg-primary text-primary-foreground min-w-5 rounded-full px-1.5 py-0.5 text-xs tabular-nums">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
      {action}
    </section>
  );
}
