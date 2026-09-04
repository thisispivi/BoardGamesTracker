"use client";

import { Heart, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";

import { Select } from "@/components/atoms/Select/Select";
import { MultiSelect } from "@/components/molecules/MultiSelect/MultiSelect";
import type {
  CollectionGame,
  LibraryFilters,
  LibraryGameType,
  LibrarySort,
  LibraryWeightFilter,
  MultiSelectOption,
  SelectOption,
} from "@/core";
import { useDurationFormatter } from "@/hooks/useDurationFormatter";
import { cn } from "@/utils/cn";
import { getTaxonomyLabel } from "@/utils/gameTaxonomy";
import { createLibraryFilters } from "@/utils/libraryFilters";

const librarySorts: LibrarySort[] = [
  "nameAscending",
  "nameDescending",
  "weightAscending",
  "weightDescending",
  "timeAscending",
  "timeDescending",
];

const libraryGameTypes: LibraryGameType[] = ["all", "baseGames", "expansions"];

const libraryWeightFilters: LibraryWeightFilter[] = [
  "all",
  "light",
  "medium",
  "heavy",
  "veryHeavy",
];

const playtimeOptions = [30, 45, 60, 90, 120, 180, 240, 360];

/**
 * Builds alphabetized taxonomy options with per-game occurrence counts.
 *
 * @param games - Candidate games used to derive available options.
 * @param taxonomy - Game metadata field represented by the facet.
 * @param locale - Active locale used for labels and ordering.
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

/**
 * Accepts a selected string only when it belongs to a controlled option list.
 *
 * @param value - Value received from the select primitive.
 * @param options - Complete list of accepted values.
 * @param fallback - Safe value used when the selection is unexpected.
 * @returns The selected option or the supplied fallback.
 */
function selectValue<Value extends string>(
  value: string,
  options: Value[],
  fallback: Value,
): Value {
  return options.find((option) => option === value) ?? fallback;
}

/**
 * Resolves one numeric select value against its bounded option list.
 *
 * @param value - Value received from the select primitive.
 * @param options - Complete list of accepted numeric values.
 * @returns The selected number, or null for any or unexpected values.
 */
function numericValue(value: string, options: number[]): number | null {
  const parsed = Number(value);
  return options.includes(parsed) ? parsed : null;
}

/** Shared browsing controls and optional collection-only favorite filter. */
type LibraryControlsProps = {
  filters: LibraryFilters;
  games: CollectionGame[];
  onChange: (filters: LibraryFilters) => void;
  showFavorites?: boolean;
};

/**
 * Renders shared search, sorting, and filtering controls for a game library.
 *
 * @param root0 - Properties that configure the controlled library toolbar.
 * @param root0.filters - Current filter and ordering state.
 * @param root0.games - Games used to derive player and taxonomy options.
 * @param root0.onChange - Callback receiving the complete next filter state.
 * @param root0.showFavorites - Whether the collection-only favorites filter is available.
 * @returns The responsive library search and filter panel.
 */
export function LibraryControls({
  filters,
  games,
  onChange,
  showFavorites = false,
}: LibraryControlsProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations("libraryFilters");
  const formatDuration = useDurationFormatter();
  const categories = useMemo(
    () => facetOptions(games, "categories", locale),
    [games, locale],
  );
  const mechanics = useMemo(
    () => facetOptions(games, "mechanics", locale),
    [games, locale],
  );
  const playerCounts = useMemo(() => {
    const maximum = Math.max(1, ...games.map((game) => game.maxPlayers));
    return Array.from({ length: maximum }, (_, index) => index + 1);
  }, [games]);
  const sortOptions: SelectOption[] = librarySorts.map((value) => ({
    label: t(`sort.${value}`),
    value,
  }));
  const playerOptions: SelectOption[] = [
    { label: t("anyPlayers"), value: "all" },
    ...playerCounts.map((count) => ({
      label: t("playerCount", { count }),
      value: String(count),
    })),
  ];
  const weightOptions: SelectOption[] = libraryWeightFilters.map((value) => ({
    label: t(`weight.${value}`),
    value,
  }));
  const timeOptions: SelectOption[] = [
    { label: t("anyTime"), value: "all" },
    ...playtimeOptions.map((minutes) => ({
      label: t("timeUpTo", { duration: formatDuration(minutes) }),
      value: String(minutes),
    })),
  ];
  const gameTypeOptions: SelectOption[] = libraryGameTypes.map((value) => ({
    label: t(`gameType.${value}`),
    value,
  }));
  const activeFilterCount = [
    Boolean(filters.query.trim()),
    filters.players !== null,
    filters.weight !== "all",
    filters.maxPlaytime !== null,
    filters.gameType !== "all",
    filters.categories.length > 0,
    filters.mechanics.length > 0,
    showFavorites && filters.favoritesOnly,
  ].filter(Boolean).length;
  const hasChanges = activeFilterCount > 0 || filters.sort !== "nameAscending";

  return (
    <section
      aria-label={t("controls")}
      className="bg-card shadow-soft mb-8 rounded-xl border p-3 sm:p-4"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_minmax(13rem,0.42fr)]">
        <label className="relative">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search
            aria-hidden="true"
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <input
            className="bg-background hover:bg-muted/40 focus-visible:border-primary/50 h-11 w-full rounded-lg border pr-4 pl-10 text-sm shadow-sm transition-colors"
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            placeholder={t("searchPlaceholder")}
            type="search"
            value={filters.query}
          />
        </label>
        <Select
          ariaLabel={t("sortLabel")}
          onValueChange={(value) =>
            onChange({
              ...filters,
              sort: selectValue(value, librarySorts, "nameAscending"),
            })
          }
          options={sortOptions}
          value={filters.sort}
        />
      </div>

      <div className="mt-3 border-t pt-3">
        <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal
              aria-hidden="true"
              className="text-primary size-4"
            />
            {t("filters")}
            {activeFilterCount > 0 ? (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </p>
          {hasChanges ? (
            <button
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors"
              onClick={() => onChange(createLibraryFilters())}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              {t("reset")}
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            ariaLabel={t("playersLabel")}
            onValueChange={(value) =>
              onChange({
                ...filters,
                players: numericValue(value, playerCounts),
              })
            }
            options={playerOptions}
            value={filters.players === null ? "all" : String(filters.players)}
          />
          <Select
            ariaLabel={t("weightLabel")}
            onValueChange={(value) =>
              onChange({
                ...filters,
                weight: selectValue(value, libraryWeightFilters, "all"),
              })
            }
            options={weightOptions}
            value={filters.weight}
          />
          <Select
            ariaLabel={t("timeLabel")}
            onValueChange={(value) =>
              onChange({
                ...filters,
                maxPlaytime: numericValue(value, playtimeOptions),
              })
            }
            options={timeOptions}
            value={
              filters.maxPlaytime === null ? "all" : String(filters.maxPlaytime)
            }
          />
          <Select
            ariaLabel={t("gameTypeLabel")}
            onValueChange={(value) =>
              onChange({
                ...filters,
                gameType: selectValue(value, libraryGameTypes, "all"),
              })
            }
            options={gameTypeOptions}
            value={filters.gameType}
          />
          <MultiSelect
            ariaLabel={t("categoryFilter")}
            clearLabel={t("clearSelection")}
            emptyLabel={t("noFilterOptions")}
            onValueChange={(values) =>
              onChange({ ...filters, categories: values })
            }
            options={categories}
            placeholder={t("allCategories")}
            searchPlaceholder={t("searchCategories")}
            selectedSummary={t("selectedFilters")}
            values={filters.categories}
          />
          <MultiSelect
            ariaLabel={t("mechanicFilter")}
            clearLabel={t("clearSelection")}
            emptyLabel={t("noFilterOptions")}
            onValueChange={(values) =>
              onChange({ ...filters, mechanics: values })
            }
            options={mechanics}
            placeholder={t("allMechanics")}
            searchPlaceholder={t("searchMechanics")}
            selectedSummary={t("selectedFilters")}
            values={filters.mechanics}
          />
          {showFavorites ? (
            <button
              aria-pressed={filters.favoritesOnly}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition-colors",
                filters.favoritesOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/60",
              )}
              onClick={() =>
                onChange({
                  ...filters,
                  favoritesOnly: !filters.favoritesOnly,
                })
              }
              type="button"
            >
              <Heart
                aria-hidden="true"
                className={cn(
                  "size-4",
                  filters.favoritesOnly && "fill-current",
                )}
              />
              {t("favorites")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
