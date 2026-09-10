"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, useInView } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";

import { GameFilters } from "@/components/molecules/GameFilters/GameFilters";
import { LibraryToolbar } from "@/components/molecules/LibraryToolbar/LibraryToolbar";
import type { LibraryFacetGame, LibraryFilters } from "@/core";

/**
 * Viewport margin that decides when the full panel counts as scrolled away.
 *
 * The top inset clears the mobile header, and the far bottom extension keeps a
 * panel still below the fold counted as visible, so only scrolling past the
 * panel reveals the compact toolbar.
 */
const panelViewportMargin = "-72px 0px 10000px 0px";

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
 * Shows the full filter panel above results and a compact toolbar once it scrolls away.
 *
 * The compact toolbar is fixed rather than sticky, so revealing it never moves
 * the cards. It stays while it holds focus, so a search that shortens the page
 * cannot remove the field being typed in. Its filter button opens the same panel
 * in a sheet that sits below select and popover layers, and every surface edits
 * one controlled state.
 *
 * @param root0 - Properties that configure the library controls.
 * @param root0.action - Add-game control shown in the compact toolbar, omitted from read-only libraries.
 * @param root0.filters - Current filter and ordering state.
 * @param root0.games - Games used to derive the available taxonomy options.
 * @param root0.onChange - Callback receiving the complete next filter state.
 * @param root0.showFavorites - Whether the favorites filter applies to this library.
 * @param root0.showPlayed - Whether private played status applies to this library.
 * @returns The inline panel, the compact toolbar when scrolled, and the filter sheet.
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
  const panelRef = useRef<HTMLDivElement>(null);
  const isPanelVisible = useInView(panelRef, {
    initial: true,
    margin: panelViewportMargin,
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isToolbarFocused, setIsToolbarFocused] = useState(false);
  const isToolbarVisible = !isPanelVisible || isToolbarFocused;

  return (
    <>
      <div ref={panelRef}>
        <GameFilters
          className="mb-8"
          filters={filters}
          games={games}
          onChange={onChange}
          showBrowseControls
          showFavorites={showFavorites}
          showPlayed={showPlayed}
        />
      </div>

      <AnimatePresence>
        {isToolbarVisible ? (
          <LibraryToolbar
            action={action}
            filters={filters}
            key="toolbar"
            onFocusChange={setIsToolbarFocused}
            onOpenFilters={() => setIsSheetOpen(true)}
            onQueryChange={(query) => onChange({ ...filters, query })}
            showFavorites={showFavorites}
            showPlayed={showPlayed}
          />
        ) : null}
      </AnimatePresence>

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
