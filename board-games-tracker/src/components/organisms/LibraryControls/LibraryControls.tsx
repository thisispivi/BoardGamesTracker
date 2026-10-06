"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { GameFilters } from "@/components/molecules/GameFilters/GameFilters";
import { LibraryToolbar } from "@/components/molecules/LibraryToolbar/LibraryToolbar";
import type { LibraryFacetGame, LibraryFilters } from "@/core";

/** Library filter state, the facets on offer, and the optional add-game control. */
type LibraryControlsProps = {
  action?: ReactNode;
  filters: LibraryFilters;
  games: LibraryFacetGame[];
  onChange: (filters: LibraryFilters) => void;
  showFavorites?: boolean;
  showPlayed?: boolean;
};

/**
 * Reduces browsing to one sticky bar, with every other filter inside a sheet.
 *
 * The library itself is the point of these pages, so nothing above the cards
 * expands: search, the filter count, and adding a game stay on a single line,
 * and the full panel opens on request in a sheet that sits below select and
 * popover layers. Both surfaces edit one controlled state.
 *
 * @param root0 - Properties that configure the library controls.
 * @param root0.action - Add-game control shown in the bar, omitted from read-only libraries.
 * @param root0.filters - Current filter and ordering state.
 * @param root0.games - Games used to derive the available taxonomy options.
 * @param root0.onChange - Callback receiving the complete next filter state.
 * @param root0.showFavorites - Whether the favorites filter applies to this library.
 * @param root0.showPlayed - Whether private played status applies to this library.
 * @returns The sticky toolbar and the filter sheet it opens.
 */
export function LibraryControls({
  action,
  filters,
  games,
  onChange,
  showFavorites = false,
  showPlayed = false,
}: LibraryControlsProps): ReactNode {
  const t = useTranslations("libraryFilters");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <LibraryToolbar
        action={action}
        filters={filters}
        onOpenFilters={() => setIsSheetOpen(true)}
        onQueryChange={(query) => onChange({ ...filters, query })}
        showFavorites={showFavorites}
        showPlayed={showPlayed}
      />

      <Dialog.Root onOpenChange={setIsSheetOpen} open={isSheetOpen}>
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
