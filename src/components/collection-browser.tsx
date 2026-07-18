"use client";

import Fuse from "fuse.js";
import { BookOpen, Heart, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { GameCard, type CollectionGame } from "@/components/game-card";
import { useI18n } from "@/components/i18n-provider";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { normalizeSearchText } from "@/lib/search";

type CollectionGroup = {
  base: CollectionGame;
  expansions: CollectionGame[];
};

/** Measures shared normalized title tokens for cautious expansion matching. */
function tokenOverlap(left: string, right: string): number {
  const leftTokens = new Set(left.split(" "));
  const rightTokens = new Set(right.split(" "));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token));
  return (
    shared.length / Math.max(1, Math.min(leftTokens.size, rightTokens.size))
  );
}

/** Associates expansions with the most likely owned base game. */
function groupCollection(games: CollectionGame[]): {
  groups: CollectionGroup[];
  ungrouped: CollectionGame[];
} {
  const baseGames = games.filter((game) => !game.isExpansion);
  const expansions = games.filter((game) => game.isExpansion);
  const searchableBases = baseGames.map((game) => ({
    game,
    normalizedName: normalizeSearchText(game.name),
  }));
  const fuzzyBases = new Fuse(searchableBases, {
    keys: ["normalizedName"],
    threshold: 0.58,
    ignoreLocation: true,
    includeScore: true,
  });
  const expansionMap = new Map<string, CollectionGame[]>();
  const ungrouped: CollectionGame[] = [];

  for (const expansion of expansions) {
    const expansionName = normalizeSearchText(expansion.name);
    const direct = searchableBases
      .filter(({ normalizedName }) =>
        expansionName.startsWith(`${normalizedName} `),
      )
      .sort(
        (left, right) =>
          right.normalizedName.length - left.normalizedName.length,
      )[0];
    const fuzzy = fuzzyBases
      .search(expansionName, { limit: 3 })
      .find(
        (result) =>
          tokenOverlap(expansionName, result.item.normalizedName) >= 0.5,
      )?.item;
    const base = direct?.game ?? fuzzy?.game;
    if (!base) {
      ungrouped.push(expansion);
      continue;
    }
    const grouped = expansionMap.get(base.id) ?? [];
    grouped.push(expansion);
    expansionMap.set(base.id, grouped);
  }

  return {
    groups: baseGames.map((base) => ({
      base,
      expansions: (expansionMap.get(base.id) ?? []).sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    })),
    ungrouped,
  };
}

/** Builds alphabetized facet options with per-game occurrence counts. */
function facetOptions(
  games: CollectionGame[],
  taxonomy: "categories" | "mechanics",
  locale: string,
): MultiSelectOption[] {
  const counts = new Map<string, number>();
  for (const game of games) {
    for (const value of new Set(game[taxonomy])) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([value, count]) => ({ count, label: value, value }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}

/** Fuzzy collection search with base-game and expansion grouping. */
export function CollectionBrowser({
  currency,
  games,
  locale,
}: {
  currency: string;
  games: CollectionGame[];
  locale: string;
}) {
  const t = useI18n();
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [mechanics, setMechanics] = useState<string[]>([]);
  const categoryOptions = useMemo(
    () => facetOptions(games, "categories", locale),
    [games, locale],
  );
  const mechanicOptions = useMemo(
    () => facetOptions(games, "mechanics", locale),
    [games, locale],
  );
  const visible = useMemo(() => {
    const filtered = games.filter(
      (game) =>
        (!favoritesOnly || game.favorite) &&
        (categories.length === 0 ||
          categories.some((category) => game.categories.includes(category))) &&
        (mechanics.length === 0 ||
          mechanics.some((mechanic) => game.mechanics.includes(mechanic))),
    );
    const term = normalizeSearchText(query);
    if (!term) {
      return filtered;
    }
    return new Fuse(filtered, {
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
  }, [categories, favoritesOnly, games, mechanics, query]);
  const grouped = useMemo(() => groupCollection(visible), [visible]);
  const expansionCount = visible.filter((game) => game.isExpansion).length;
  const hasFilters =
    Boolean(query.trim()) ||
    favoritesOnly ||
    categories.length > 0 ||
    mechanics.length > 0;

  if (games.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-16 text-center">
        <BookOpen className="text-primary mx-auto size-9" />
        <h2 className="font-display mt-5 text-2xl font-bold">
          {t("collection.emptyTitle")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">
          {t("collection.emptyBody")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card mb-8 grid gap-3 rounded-2xl border p-3 shadow-sm lg:grid-cols-[minmax(16rem,1fr)_minmax(13rem,0.5fr)_minmax(13rem,0.5fr)_auto] lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t("collection.searchLabel")}</span>
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-muted/60 focus:ring-primary/20 h-11 w-full rounded-xl pr-4 pl-10 text-sm transition focus:ring-4 focus:outline-none"
            placeholder={t("collection.searchPlaceholder")}
          />
        </label>
        <MultiSelect
          ariaLabel={t("collection.categoryFilter")}
          values={categories}
          onValueChange={setCategories}
          options={categoryOptions}
          placeholder={t("collection.allCategories")}
          searchPlaceholder={t("collection.searchCategories")}
          selectedSummary={t("collection.selectedFilters")}
          clearLabel={t("collection.clearSelection")}
          emptyLabel={t("collection.noFilterOptions")}
        />
        <MultiSelect
          ariaLabel={t("collection.mechanicFilter")}
          values={mechanics}
          onValueChange={setMechanics}
          options={mechanicOptions}
          placeholder={t("collection.allMechanics")}
          searchPlaceholder={t("collection.searchMechanics")}
          selectedSummary={t("collection.selectedFilters")}
          clearLabel={t("collection.clearSelection")}
          emptyLabel={t("collection.noFilterOptions")}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((value) => !value)}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold whitespace-nowrap transition lg:flex-none ${favoritesOnly ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <Heart
              className={`size-4 ${favoritesOnly ? "fill-current" : ""}`}
            />
            {t("collection.favorites")}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFavoritesOnly(false);
                setCategories([]);
                setMechanics([]);
              }}
              aria-label={t("collection.clearFilters")}
              className="hover:bg-muted grid size-11 shrink-0 place-items-center rounded-xl border transition"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
        </div>
      </div>

      {visible.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                {t("collection.mainShelf")}
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold">
                {t("collection.games")}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              {t(
                grouped.groups.length === 1
                  ? "collection.gameCountOne"
                  : "collection.gameCountMany",
                { count: grouped.groups.length },
              )}
              {" · "}
              {t(
                expansionCount === 1
                  ? "collection.expansionCountOne"
                  : "collection.expansionCountMany",
                { count: expansionCount },
              )}
            </p>
          </div>
          <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {grouped.groups.map((group, index) => (
              <GameCard
                key={group.base.id}
                game={group.base}
                expansions={group.expansions}
                eager={index < 3}
                currency={currency}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {grouped.ungrouped.length > 0 && (
        <section className="mt-12">
          <div className="mb-5">
            <p className="text-accent text-xs font-bold tracking-widest uppercase">
              {t("collection.addons")}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold">
              {t("collection.otherExpansions")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("collection.otherExpansionsBody")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {grouped.ungrouped.map((expansion) => (
              <GameCard
                key={expansion.id}
                game={expansion}
                compact
                currency={currency}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {visible.length === 0 && (
        <div className="rounded-3xl border border-dashed py-20 text-center">
          <Search className="text-primary mx-auto size-7" />
          <p className="text-muted-foreground mt-4">
            {t("collection.noMatches")}
          </p>
        </div>
      )}
    </>
  );
}
