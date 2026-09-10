"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameFilters } from "@/components/molecules/GameFilters/GameFilters";
import type { CollectionGame, LibraryFilters } from "@/core";

/** Library filter state and the facets the surrounding view exposes. */
type GameFiltersSheetProps = {
  filters: LibraryFilters;
  games: CollectionGame[];
  onChange: (filters: LibraryFilters) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showFavorites?: boolean;
  showPlayed?: boolean;
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
 * @param root0.onOpenChange - Callback receiving responsive sheet visibility changes.
 * @param root0.open - Whether the responsive sheet is visible.
 * @param root0.showFavorites - Whether the favorites filter applies to this library.
 * @param root0.showPlayed - Whether private played status applies to this library.
 * @returns The inline panel and responsive filter sheet.
 */
export function GameFiltersSheet({
  filters,
  games,
  onChange,
  onOpenChange,
  open,
  showFavorites = false,
  showPlayed = false,
}: GameFiltersSheetProps): ReactNode {
  const t = useTranslations("libraryFilters");

  return (
    <>
      <GameFilters
        className="mb-8 hidden md:block"
        filters={filters}
        games={games}
        onChange={onChange}
        showBrowseControls
        showFavorites={showFavorites}
        showPlayed={showPlayed}
      />

      <Dialog.Root onOpenChange={onOpenChange} open={open}>
        <Dialog.Portal>
          <Dialog.Overlay className="edit-dialog-overlay fixed inset-0 z-70 bg-black/55 backdrop-blur-sm" />
          <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-71 flex max-h-[85dvh] flex-col rounded-t-xl border p-4 shadow-2xl focus:outline-none md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[min(34rem,calc(100vw-2rem))] md:rounded-none md:p-6">
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
                showPlayed={showPlayed}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
