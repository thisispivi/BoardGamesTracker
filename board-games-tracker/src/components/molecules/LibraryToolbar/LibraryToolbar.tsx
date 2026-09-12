"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { LibraryFilters } from "@/core";
import { countActiveFilters } from "@/utils/libraryFilters";

/** Vertical travel, in pixels, of the toolbar as it slides in and out. */
const slideDistance = 12;

/** Search, filter state, and optional mutation kept reachable while results scroll. */
type LibraryToolbarProps = {
  action?: ReactNode;
  filters: LibraryFilters;
  onFocusChange: (isFocused: boolean) => void;
  onOpenFilters: () => void;
  onQueryChange: (query: string) => void;
  showFavorites?: boolean;
  showPlayed?: boolean;
};

/**
 * Pins search, filters, and the add-game control across the top of the content area.
 *
 * The bar spans the full width beside the navigation sidebar with only a bottom
 * border, while its controls align with the page content. It is fixed, so it
 * overlays the results instead of shifting them.
 *
 * @param root0 - Properties that configure the compact browsing toolbar.
 * @param root0.action - Optional add-game control omitted from read-only libraries.
 * @param root0.filters - Current state used for search and the active-filter badge.
 * @param root0.onFocusChange - Callback reporting whether focus is inside the toolbar.
 * @param root0.onOpenFilters - Callback that opens the filter sheet.
 * @param root0.onQueryChange - Callback receiving the next search query.
 * @param root0.showFavorites - Whether favorite status contributes to the badge.
 * @param root0.showPlayed - Whether played status contributes to the badge.
 * @returns A fixed, keyboard-accessible toolbar that slides into view.
 */
export function LibraryToolbar({
  action,
  filters,
  onFocusChange,
  onOpenFilters,
  onQueryChange,
  showFavorites = false,
  showPlayed = false,
}: LibraryToolbarProps): ReactNode {
  const t = useTranslations("libraryFilters");
  const offset = useReducedMotion() ? 0 : -slideDistance;
  const activeFilterCount = countActiveFilters(filters, {
    favorites: showFavorites,
    played: showPlayed,
    query: true,
  });

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label={t("quickControls")}
      className="bg-background/94 fixed inset-x-0 top-18 z-10 border-b shadow-sm backdrop-blur-md lg:top-0 lg:left-[270px]"
      exit={{ opacity: 0, y: offset }}
      initial={{ opacity: 0, y: offset }}
      onBlur={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          onFocusChange(false);
        }
      }}
      onFocus={() => onFocusChange(true)}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="mx-auto grid w-full max-w-320 grid-cols-[minmax(0,1fr)_auto_auto] gap-2 px-5 py-3 sm:px-8 lg:px-12">
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
      </div>
    </motion.section>
  );
}
