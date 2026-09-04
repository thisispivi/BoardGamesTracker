"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameFilters } from "@/components/molecules/GameFilters/GameFilters";
import type { CollectionGame, LibraryFilters } from "@/core";
import { countActiveFilters } from "@/utils/libraryFilters";

/** Library filter state and the facets the surrounding view exposes. */
type GameFiltersSheetProps = {
  filters: LibraryFilters;
  games: CollectionGame[];
  onChange: (filters: LibraryFilters) => void;
  showFavorites?: boolean;
};

/**
 * Presents the shared library filters inline on wide screens and behind a floating control on narrow ones.
 *
 * Both presentations render the same controlled panel, so a filter changed in
 * the mobile sheet is already applied when the viewport widens. The sheet sits
 * below the select and popover layers so facet dropdowns opened inside it stay
 * visible above the sheet.
 *
 * @param root0 - Properties that configure the responsive filter surface.
 * @param root0.filters - Current filter and ordering state.
 * @param root0.games - Games used to derive the available taxonomy options.
 * @param root0.onChange - Callback receiving the complete next filter state.
 * @param root0.showFavorites - Whether the favorites filter applies to this library.
 * @returns The inline panel, the floating trigger, and the mobile filter sheet.
 */
export function GameFiltersSheet({
  filters,
  games,
  onChange,
  showFavorites = false,
}: GameFiltersSheetProps): ReactNode {
  const t = useTranslations("libraryFilters");
  const activeFilterCount = countActiveFilters(filters, {
    favorites: showFavorites,
    query: true,
  });

  return (
    <>
      <GameFilters
        className="mb-8 hidden md:block"
        filters={filters}
        games={games}
        onChange={onChange}
        showBrowseControls
        showFavorites={showFavorites}
      />

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            aria-label={t("openFilters")}
            className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-60 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-bold shadow-lg transition hover:brightness-110 md:hidden"
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {t("filters")}
            {activeFilterCount > 0 ? (
              <span className="bg-primary-foreground/20 min-w-5 rounded-full px-1.5 py-0.5 text-xs tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="edit-dialog-overlay fixed inset-0 z-70 bg-black/55 backdrop-blur-sm md:hidden" />
          <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-71 flex max-h-[85dvh] flex-col rounded-t-xl border p-4 shadow-2xl focus:outline-none md:hidden">
            <div className="flex shrink-0 justify-end">
              <Dialog.Title className="sr-only">{t("filters")}</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label={t("closeFilters")}
                  className="hover:bg-muted grid size-10 shrink-0 place-items-center rounded-full transition"
                  type="button"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              <GameFilters
                className="border-0 p-0 shadow-none"
                filters={filters}
                games={games}
                onChange={onChange}
                showBrowseControls
                showFavorites={showFavorites}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
