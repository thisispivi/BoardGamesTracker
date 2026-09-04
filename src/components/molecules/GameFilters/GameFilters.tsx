"use client";

import type { LucideIcon } from "lucide-react";
import {
  Clock3,
  Gauge,
  Heart,
  Layers,
  RotateCcw,
  Search,
  Shapes,
  SlidersHorizontal,
  Tags,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";

import { Select } from "@/components/atoms/Select/Select";
import { MultiSelect } from "@/components/molecules/MultiSelect/MultiSelect";
import { RangeField } from "@/components/molecules/RangeField/RangeField";
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
import { getTaxonomyLabel, isExpansionCategory } from "@/utils/gameTaxonomy";
import {
  createLibraryFilters,
  isFullRange,
  playerRangeBounds,
  playtimeRangeBounds,
  playtimeRangeStep,
} from "@/utils/libraryFilters";

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

/**
 * Builds alphabetized taxonomy options with per-game occurrence counts.
 *
 * Expansion marker categories are dropped because the dedicated game-type
 * filter already covers them.
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
      if (taxonomy === "categories" && isExpansionCategory(value)) continue;
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

/** Shared browsing controls and optional collection-only favorite filter. */
type GameFiltersProps = {
  className?: string;
  filters: LibraryFilters;
  games: CollectionGame[];
  onChange: (filters: LibraryFilters) => void;
  showFavorites?: boolean;
};

/**
 * Renders the search, range, facet, and ordering panel shared by every game view.
 *
 * The panel adapts its column count to the width of its container, so the same
 * markup serves both the wide library toolbar and the narrow picker sidebar.
 *
 * @param root0 - Properties that configure the controlled filter panel.
 * @param root0.className - Optional classes merged with the component styles.
 * @param root0.filters - Current filter and ordering state.
 * @param root0.games - Games used to derive the available taxonomy options.
 * @param root0.onChange - Callback receiving the complete next filter state.
 * @param root0.showFavorites - Whether the favorites filter applies to this library.
 * @returns The rendered filter panel.
 */
export function GameFilters({
  className,
  filters,
  games,
  onChange,
  showFavorites = false,
}: GameFiltersProps): ReactNode {
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
  const sortOptions: SelectOption[] = librarySorts.map((value) => ({
    label: t(`sort.${value}`),
    value,
  }));
  const weightOptions: SelectOption[] = libraryWeightFilters.map((value) => ({
    label: t(`weight.${value}`),
    value,
  }));
  const gameTypeOptions: SelectOption[] = libraryGameTypes.map((value) => ({
    label: t(`gameType.${value}`),
    value,
  }));
  const playersActive = !isFullRange(filters.players, playerRangeBounds);
  const playtimeActive = !isFullRange(filters.playtime, playtimeRangeBounds);
  const activeFilterCount = [
    Boolean(filters.query.trim()),
    playersActive,
    playtimeActive,
    filters.weight !== "all",
    filters.gameType !== "all",
    filters.categories.length > 0,
    filters.mechanics.length > 0,
    showFavorites && filters.favoritesOnly,
  ].filter(Boolean).length;
  const hasChanges = activeFilterCount > 0 || filters.sort !== "nameAscending";

  return (
    <section
      aria-label={t("controls")}
      className={cn(
        "bg-card shadow-soft @container rounded-xl border p-4",
        className,
      )}
    >
      <div className="mb-4 flex min-h-9 items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold">
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

      <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
        <FilterField icon={Search} label={t("names.search")}>
          <label className="relative block">
            <span className="sr-only">{t("searchLabel")}</span>
            <Search
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              className="bg-background hover:bg-muted/40 focus-visible:border-primary/50 h-11 w-full rounded-lg border pr-3 pl-10 text-sm shadow-sm transition-colors"
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              placeholder={t("searchPlaceholder")}
              type="search"
              value={filters.query}
            />
          </label>
        </FilterField>

        <FilterField icon={SlidersHorizontal} label={t("names.sort")}>
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
        </FilterField>

        <FilterField icon={Users} label={t("names.players")}>
          <RangeField
            bounds={playerRangeBounds}
            maximumLabel={t("maxPlayers")}
            minimumLabel={t("minPlayers")}
            onValueChange={(players) => onChange({ ...filters, players })}
            step={1}
            summary={
              playersActive
                ? t("playersRange", {
                    from: filters.players.min,
                    to: filters.players.max,
                  })
                : t("anyPlayers")
            }
            value={filters.players}
          />
        </FilterField>

        <FilterField icon={Clock3} label={t("names.playtime")}>
          <RangeField
            bounds={playtimeRangeBounds}
            maximumLabel={t("maxPlaytime")}
            minimumLabel={t("minPlaytime")}
            onValueChange={(playtime) => onChange({ ...filters, playtime })}
            step={playtimeRangeStep}
            summary={
              playtimeActive
                ? t("playtimeRange", {
                    from: formatDuration(filters.playtime.min),
                    to: formatDuration(filters.playtime.max),
                  })
                : t("anyTime")
            }
            value={filters.playtime}
          />
        </FilterField>

        <FilterField icon={Gauge} label={t("names.complexity")}>
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
        </FilterField>

        <FilterField icon={Layers} label={t("names.gameType")}>
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
        </FilterField>

        <FilterField
          count={filters.categories.length}
          icon={Tags}
          label={t("names.categories")}
        >
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
            selectedSummary={t("selectedCount", {
              count: filters.categories.length,
            })}
            values={filters.categories}
          />
        </FilterField>

        <FilterField
          count={filters.mechanics.length}
          icon={Shapes}
          label={t("names.mechanics")}
        >
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
            selectedSummary={t("selectedCount", {
              count: filters.mechanics.length,
            })}
            values={filters.mechanics}
          />
        </FilterField>

        {showFavorites ? (
          <FilterField icon={Heart} label={t("names.favorites")}>
            <button
              aria-pressed={filters.favoritesOnly}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition-colors",
                filters.favoritesOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted/60",
              )}
              onClick={() =>
                onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })
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
              {filters.favoritesOnly ? t("favoritesOnly") : t("allGames")}
            </button>
          </FilterField>
        ) : null}
      </div>
    </section>
  );
}

/** Visible name, icon, and selection count rendered above one filter control. */
type FilterFieldProps = {
  children: ReactNode;
  count?: number;
  icon: LucideIcon;
  label: string;
};

/**
 * Labels one filter control so the facet being narrowed is always identifiable.
 *
 * @param root0 - Properties that configure filter field.
 * @param root0.children - The filter control the label describes.
 * @param root0.count - Number of active selections shown beside the label.
 * @param root0.icon - Decorative icon rendered beside the label.
 * @param root0.label - Localized name of the facet being filtered.
 * @returns A labeled filter control.
 */
function FilterField({
  children,
  count = 0,
  icon: Icon,
  label,
}: FilterFieldProps): ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <Icon aria-hidden="true" className="text-primary size-3.5" />
        {label}
        {count > 0 ? (
          <span className="bg-primary text-primary-foreground min-w-4 rounded-full px-1 text-center text-[0.625rem] tabular-nums">
            {count}
          </span>
        ) : null}
      </p>
      {children}
    </div>
  );
}
