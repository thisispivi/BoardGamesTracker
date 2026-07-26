"use client";

import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { WishlistCard } from "@/components/organisms/WishlistCard/WishlistCard";
import type { CollectionGame } from "@/core";
import { normalizeSearchText } from "@/utils/search";

type WishlistBrowserProps = {
  currency: string;
  games: CollectionGame[];
};

/**
 * Fuzzy searchable grid of wishlist games.
 *
 * @param root0 - Component or function properties.
 * @param root0.currency - The user's display currency.
 * @param root0.games - The wishlist games to show.
 * @returns The documented function result.
 */
export function WishlistBrowser({
  currency,
  games,
}: WishlistBrowserProps): ReactNode {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return games;

    return new Fuse(games, {
      keys: [
        { name: "name", weight: 0.8 },
        { name: "categories", weight: 0.25 },
        { name: "mechanics", weight: 0.35 },
        { name: "families", weight: 0.15 },
      ],
      threshold: 0.42,
      ignoreLocation: true,
      useTokenSearch: true,
    })
      .search(term)
      .map((result) => result.item);
  }, [games, query]);

  return (
    <>
      <div className="bg-card mb-8 rounded-2xl border p-3 shadow-sm">
        <label className="relative flex-1">
          <span className="sr-only">{t("wishlist.searchLabel")}</span>
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            className="bg-muted/60 focus:ring-primary/20 h-11 w-full rounded-xl pr-4 pl-10 text-sm transition focus:ring-4 focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("wishlist.searchPlaceholder")}
            type="search"
            value={query}
          />
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((game) => (
            <WishlistCard currency={currency} game={game} key={game.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed py-20 text-center">
          <Search className="text-primary mx-auto size-7" />
          <p className="text-muted-foreground mt-4">
            {t("wishlist.noMatches")}
          </p>
        </div>
      )}
    </>
  );
}
