"use client";

import Fuse from "fuse.js";
import { BookOpen, Heart, RotateCcw, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { SectionHeading } from "@/components/atoms/SectionHeading/SectionHeading";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { MultiSelect } from "@/components/molecules/MultiSelect/MultiSelect";
import { GameCard } from "@/components/organisms/GameCard/GameCard";
import type { CollectionGame, MultiSelectOption } from "@/core";
import { cn } from "@/utils/cn";
import { groupCollection } from "@/utils/collectionGrouping";
import { getTaxonomyLabel } from "@/utils/gameTaxonomy";
import { normalizeSearchText } from "@/utils/search";

/**
 * Builds alphabetized facet options with per-game occurrence counts.
 *
 * @param games - The candidate games.
 * @param taxonomy - Taxonomy namespace used to resolve the translated label.
 * @param locale - Active application locale used for translated labels.
 * @returns Sorted, localized options for the requested taxonomy facet.
 */
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
    .map(([value, count]) => ({
      count,
      label: getTaxonomyLabel(
        value,
        taxonomy === "categories" ? "category" : "mechanic",
        locale,
      ),
      value,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}

/** Collection data and presentation mode used by the browser. */
type CollectionBrowserProps = {
  currency: string;
  games: CollectionGame[];
  readOnly?: boolean;
};

/**
 * Fuzzy collection search with base-game and expansion grouping.
 *
 * @param root0 - Properties that configure collection browser.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.games - Game records available to the component.
 * @param root0.readOnly - Whether mutation controls must be omitted.
 * @returns The rendered collection browser.
 */
export function CollectionBrowser({
  currency,
  games,
  readOnly = false,
}: CollectionBrowserProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
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
      <EmptyState
        description={t("collection.emptyBody")}
        icon={BookOpen}
        title={t("collection.emptyTitle")}
      />
    );
  }

  return (
    <>
      <div className="bg-card mb-8 grid gap-3 rounded-lg border p-3 shadow-sm lg:grid-cols-[minmax(16rem,1fr)_minmax(13rem,0.5fr)_minmax(13rem,0.5fr)_auto] lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t("collection.searchLabel")}</span>
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            className="bg-muted/60 h-11 w-full rounded-lg pr-4 pl-10 text-sm transition"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("collection.searchPlaceholder")}
            type="search"
            value={query}
          />
        </label>
        <MultiSelect
          ariaLabel={t("collection.categoryFilter")}
          clearLabel={t("collection.clearSelection")}
          emptyLabel={t("collection.noFilterOptions")}
          onValueChange={setCategories}
          options={categoryOptions}
          placeholder={t("collection.allCategories")}
          searchPlaceholder={t("collection.searchCategories")}
          selectedSummary={t("collection.selectedFilters")}
          values={categories}
        />
        <MultiSelect
          ariaLabel={t("collection.mechanicFilter")}
          clearLabel={t("collection.clearSelection")}
          emptyLabel={t("collection.noFilterOptions")}
          onValueChange={setMechanics}
          options={mechanicOptions}
          placeholder={t("collection.allMechanics")}
          searchPlaceholder={t("collection.searchMechanics")}
          selectedSummary={t("collection.selectedFilters")}
          values={mechanics}
        />
        <div className="flex items-center gap-2">
          <button
            aria-pressed={favoritesOnly}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold whitespace-nowrap transition lg:flex-none",
              favoritesOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted",
            )}
            onClick={() => setFavoritesOnly((value) => !value)}
            type="button"
          >
            <Heart className={cn("size-4", favoritesOnly && "fill-current")} />
            {t("collection.favorites")}
          </button>
          {hasFilters ? (
            <button
              aria-label={t("collection.clearFilters")}
              className="hover:bg-muted grid size-11 shrink-0 place-items-center rounded-lg border transition"
              onClick={() => {
                setQuery("");
                setFavoritesOnly(false);
                setCategories([]);
                setMechanics([]);
              }}
              type="button"
            >
              <RotateCcw className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {visible.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow={t("collection.mainShelf")}
            meta={
              <p className="text-muted-foreground text-sm">
                {t("collection.gameCount", { count: grouped.groups.length })}
                {" · "}
                {t("collection.expansionCount", { count: expansionCount })}
              </p>
            }
            title={t("collection.games")}
          />
          <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {grouped.groups.map((group, index) => (
              <GameCard
                currency={currency}
                eager={index < 3}
                expansions={group.expansions}
                game={group.base}
                key={group.base.id}
                readOnly={readOnly}
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
            tone="accent"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {grouped.ungrouped.map((expansion) => (
              <GameCard
                compact
                currency={currency}
                game={expansion}
                key={expansion.id}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState description={t("collection.noMatches")} icon={Search} />
      ) : null}
    </>
  );
}
