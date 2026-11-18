"use client";

import { Search } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { SectionHeading } from "@/components/atoms/SectionHeading/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { GameCardShell } from "@/components/organisms/GameCardShell/GameCardShell";
import { LibraryControls } from "@/components/organisms/LibraryControls/LibraryControls";
import type { CollectionGame } from "@/core";
import { groupCollection } from "@/utils/collectionGrouping";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";

/** Fictional library and its location used by the static browser. */
type DemoLibraryBrowserProps = {
  games: CollectionGame[];
  wishlist: boolean;
};

/**
 * Browses the fictional account using the application's real filters and card layout.
 *
 * @param root0 - Library displayed by the browser.
 * @param root0.games - Complete example collection or wishlist.
 * @param root0.wishlist - Whether collection-specific filters and grouping are omitted.
 * @returns A searchable, filterable library without account mutation controls.
 */
export function DemoLibraryBrowser({
  games,
  wishlist,
}: DemoLibraryBrowserProps): ReactNode {
  const [filters, setFilters] = useState(createLibraryFilters);
  const locale = useLocale();
  const t = useTranslations();
  const format = useFormatter();
  const filtered = filterAndSortLibraryGames(games, filters, locale);
  const grouped = groupCollection(filtered);
  const groups = wishlist
    ? filtered.map((base) => ({ base, expansions: [] }))
    : grouped.groups;

  return (
    <>
      <LibraryControls
        filters={filters}
        games={games}
        onChange={setFilters}
        showFavorites={!wishlist}
        showPlayed={!wishlist}
      />
      {!wishlist ? (
        <SectionHeading
          eyebrow={t("collection.mainShelf")}
          meta={
            <p className="text-muted-foreground text-sm">
              {t("collection.gameCount", { count: groups.length })}
              {" · "}
              {t("collection.expansionCount", {
                count: filtered.filter((game) => game.isExpansion).length,
              })}
            </p>
          }
          title={t("collection.games")}
        />
      ) : null}
      <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {groups.map(({ base, expansions }, index) => (
          <GameCardShell
            eager={index < 3}
            game={base}
            key={base.id}
            meta={
              !wishlist && base.moneySpent > 0 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-foreground font-semibold">
                    {format.number(base.moneySpent, {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </>
              ) : undefined
            }
          >
            {expansions.length > 0 ? (
              <section className="bg-muted/40 border-t px-3 py-2">
                <p className="text-muted-foreground pb-1 text-[0.6875rem] font-bold uppercase">
                  {t("game.expansions")} · {expansions.length}
                </p>
                {expansions.map((game) => (
                  <div
                    className="flex items-center gap-2.5 rounded-lg p-1"
                    key={game.id}
                  >
                    <GameArtwork
                      className="w-10 shrink-0"
                      imageUrl={game.imageUrl}
                      name={game.name}
                    />
                    <span className="text-xs font-semibold">{game.name}</span>
                  </div>
                ))}
              </section>
            ) : null}
          </GameCardShell>
        ))}
        {!wishlist
          ? grouped.ungrouped.map((game) => (
              <GameCardShell eager={false} game={game} key={game.id} />
            ))
          : null}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          description={t(
            wishlist ? "wishlist.noMatches" : "collection.noMatches",
          )}
          icon={Search}
        />
      ) : null}
    </>
  );
}
