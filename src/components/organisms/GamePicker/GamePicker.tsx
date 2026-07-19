"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Clock3,
  Dices,
  Gauge,
  Heart,
  LayoutGrid,
  ListFilter,
  PackageX,
  RotateCcw,
  Shapes,
  Sparkles,
  Tags,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useRef, useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { Select } from "@/components/atoms/Select/Select";
import { MultiSelect } from "@/components/molecules/MultiSelect/MultiSelect";
import type { CollectionGame, MultiSelectOption } from "@/core";
import { useDurationFormatter } from "@/hooks/useDurationFormatter";
import { getTaxonomyLabel, isExpansionCategory } from "@/utils/gameTaxonomy";
import { filterGames, pickRandomGame } from "@/utils/picker";

type ReelGame = {
  gameId: string;
  imageUrl?: string | null;
  name: string;
};

type ReelRun = {
  id: number;
  items: ReelGame[];
  startX: number;
  targetX: number;
  winnerId: string;
};

type GamePickerProps = { games: CollectionGame[] };

/**
 * Animated filter-and-reel experience for choosing a collection game.
 *
 * @param root0 - Component or function properties.
 * @param root0.games - The 'games' property.
 * @returns The documented function result.
 */
export function GamePicker({ games }: GamePickerProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const formatDuration = useDurationFormatter();
  const reduceMotion = useReducedMotion();
  const [players, setPlayers] = useState(4);
  const [maxMinutes, setMaxMinutes] = useState(120);
  const [maxWeight, setMaxWeight] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [mechanics, setMechanics] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [excludeExpansions, setExcludeExpansions] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reelRun, setReelRun] = useState<ReelRun | null>(null);
  const reelCardRef = useRef<HTMLDivElement>(null);
  const reelStageRef = useRef<HTMLElement>(null);
  const reelTrackRef = useRef<HTMLDivElement>(null);
  const reelRunId = useRef(0);
  const filters = {
    players,
    maxMinutes,
    maxWeight,
    favoritesOnly,
    mechanics,
    themes,
    excludeExpansions,
  };
  const pickable = useMemo(
    () =>
      games.map((game) => ({
        gameId: game.gameId,
        name: game.name,
        imageUrl: game.imageUrl,
        isExpansion: game.isExpansion,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        maxPlaytime: game.maxPlaytime,
        weight: game.weight,
        favorite: game.favorite,
        categories: game.categories,
        mechanics: game.mechanics,
        families: game.families,
      })),
    [games],
  );
  const mechanicOptions = useMemo(
    () => pickerOptions(games, "mechanic", locale),
    [games, locale],
  );
  const themeOptions = useMemo(
    () => pickerOptions(games, "theme", locale),
    [games, locale],
  );
  const candidates = filterGames(pickable, filters);
  const selected = games.find((game) => game.gameId === selectedId) ?? null;

  /** Runs a cover reel that decelerates onto a preselected eligible game. */
  function spin(): void {
    if (candidates.length === 0 || spinning) {
      return;
    }

    const picked = pickRandomGame(pickable, filters);
    if (!picked) return;

    const { cardWidth, gap } = getReelMetrics(
      reelCardRef.current,
      reelTrackRef.current,
    );
    const { items, winnerIndex } = buildReelSequence(candidates, picked.gameId);

    reelRunId.current += 1;
    setSelectedId(null);
    setSpinning(true);
    setReelRun({
      id: reelRunId.current,
      items,
      startX: -cardWidth / 2,
      targetX: -(winnerIndex * (cardWidth + gap) + cardWidth / 2),
      winnerId: picked.gameId,
    });
  }

  /**
   * Reveals a manually chosen candidate and returns mobile users to the stage.
   *
   * @param gameId - The 'gameId' value.
   */
  function selectCandidate(gameId: string): void {
    setSelectedId(gameId);
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      reelStageRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  if (games.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-8 text-center sm:p-16">
        <Dices className="text-primary mx-auto size-10" />
        <h2 className="font-display mt-5 text-2xl font-bold">
          {t("picker.emptyTitle")}
        </h2>
        <p className="text-muted-foreground mt-2">{t("picker.emptyBody")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="bg-card shadow-soft order-2 rounded-3xl border p-4 sm:p-7 lg:order-1">
        <button
          aria-expanded={filtersOpen}
          className="flex w-full items-center justify-between gap-4 rounded-2xl p-2 text-left lg:hidden"
          onClick={() => setFiltersOpen((open) => !open)}
          type="button"
        >
          <span>
            <span className="font-display block text-lg font-bold">
              {t("picker.filters")}
            </span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              {t("picker.optional")}
            </span>
          </span>
          <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-xl">
            <ChevronDown
              className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
        <div
          className={`${filtersOpen ? "mt-5 block" : "hidden"} lg:mt-0 lg:block`}
        >
          <div className="mb-7 flex items-center gap-3">
            <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">
                {t("picker.setTable")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {t("picker.optional")}
              </p>
            </div>
          </div>
          <div className="space-y-7">
            <label className="block">
              <FilterLabel icon={Users} label={t("picker.players")}>
                <strong className="bg-muted rounded-full px-3 py-1 text-xs">
                  {players}
                </strong>
              </FilterLabel>
              <input
                className="w-full accent-(--primary)"
                max={12}
                min={1}
                onChange={(event) => setPlayers(Number(event.target.value))}
                type="range"
                value={players}
              />
            </label>
            <label className="block">
              <FilterLabel icon={Clock3} label={t("picker.maxTime")}>
                <strong className="bg-muted rounded-full px-3 py-1 text-xs">
                  {maxMinutes === 0
                    ? t("picker.any")
                    : formatDuration(maxMinutes)}
                </strong>
              </FilterLabel>
              <input
                className="w-full accent-(--primary)"
                max={240}
                min={0}
                onChange={(event) => setMaxMinutes(Number(event.target.value))}
                step={30}
                type="range"
                value={maxMinutes}
              />
            </label>
            <div className="text-sm font-bold">
              <FilterLabel icon={Gauge} label={t("picker.complexity")} />
              <Select
                ariaLabel={t("picker.complexity")}
                onValueChange={(value) => setMaxWeight(Number(value))}
                options={[
                  { value: "0", label: t("picker.anyComplexity") },
                  { value: "2", label: t("picker.light") },
                  { value: "3", label: t("picker.medium") },
                  { value: "4", label: t("picker.heavy") },
                ]}
                value={String(maxWeight)}
              />
            </div>
            <div className="text-sm font-bold">
              <FilterLabel icon={Shapes} label={t("picker.mechanics")} />
              <MultiSelect
                ariaLabel={t("picker.mechanics")}
                clearLabel={t("picker.clearSelection")}
                emptyLabel={t("picker.noFilterOptions")}
                onValueChange={setMechanics}
                options={mechanicOptions}
                placeholder={t("picker.allMechanics")}
                searchPlaceholder={t("picker.searchMechanics")}
                selectedSummary={t("picker.selectedFilters")}
                values={mechanics}
              />
            </div>
            <div className="text-sm font-bold">
              <FilterLabel icon={Tags} label={t("picker.themes")} />
              <MultiSelect
                ariaLabel={t("picker.themes")}
                clearLabel={t("picker.clearSelection")}
                emptyLabel={t("picker.noFilterOptions")}
                onValueChange={setThemes}
                options={themeOptions}
                placeholder={t("picker.allThemes")}
                searchPlaceholder={t("picker.searchThemes")}
                selectedSummary={t("picker.selectedFilters")}
                values={themes}
              />
            </div>
            <label className="bg-muted/70 flex cursor-pointer items-center justify-between rounded-xl p-4 text-sm font-bold">
              <span className="flex items-center gap-3">
                <FilterIcon icon={Heart} tone="danger" />
                {t("picker.favoritesOnly")}
              </span>
              <input
                checked={favoritesOnly}
                className="size-4 accent-(--primary)"
                onChange={(event) => setFavoritesOnly(event.target.checked)}
                type="checkbox"
              />
            </label>
            <label className="bg-muted/70 flex cursor-pointer items-center justify-between rounded-xl p-4 text-sm font-bold">
              <span className="flex items-center gap-3">
                <FilterIcon icon={PackageX} />
                {t("picker.excludeExpansions")}
              </span>
              <input
                checked={excludeExpansions}
                className="size-4 accent-(--primary)"
                onChange={(event) => setExcludeExpansions(event.target.checked)}
                type="checkbox"
              />
            </label>
          </div>
        </div>
      </aside>

      <section
        className="bg-card shadow-soft relative order-1 grid min-h-[470px] min-w-0 scroll-mt-24 place-items-center overflow-hidden rounded-3xl border px-4 pt-20 pb-5 sm:min-h-[570px] sm:px-6 sm:pt-24 sm:pb-6 lg:order-2"
        ref={reelStageRef}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--primary)_17%,transparent),transparent_48%)] opacity-50" />
        <div className="absolute inset-x-4 top-4 z-40 flex justify-center sm:inset-x-6 sm:top-6">
          <PossibleGamesDialog
            candidates={candidates}
            onSelect={selectCandidate}
          />
        </div>
        <AnimatePresence mode="wait">
          {selected && !spinning ? (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative z-10 w-full max-w-sm text-center"
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              key={selected.id}
            >
              <p className="text-accent mb-4 text-xs font-bold tracking-[0.2em] uppercase">
                {t("picker.tonight")}
              </p>
              <GameArtwork
                className="shadow-2xl"
                imageUrl={selected.imageUrl}
                name={selected.name}
              />
              <h2 className="font-display mt-6 text-3xl font-bold">
                {selected.name}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {selected.minPlayers}–{selected.maxPlayers}{" "}
                {t("common.players")} · {formatDuration(selected.maxPlaytime)}
              </p>
              <Button
                className="mt-6"
                onClick={spin}
                type="button"
                variant="secondary"
              >
                <RotateCcw className="size-4" /> {t("picker.spinAgain")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="relative z-10 w-full min-w-0 text-center"
              initial={{ opacity: 0 }}
              key="reel"
            >
              <CoverReel
                candidates={candidates}
                cardRef={reelCardRef}
                onComplete={() => {
                  if (!reelRun || !spinning) return;
                  setSelectedId(reelRun.winnerId);
                  setSpinning(false);
                }}
                reduceMotion={reduceMotion ?? false}
                reelRun={reelRun}
                spinning={spinning}
                trackRef={reelTrackRef}
              />
              <Button
                className="mt-10 min-w-48"
                disabled={spinning || candidates.length === 0}
                onClick={spin}
                size="lg"
                type="button"
              >
                {spinning ? (
                  <>
                    <RotateCcw className="size-4 animate-spin" />{" "}
                    {t("picker.choosing")}
                  </>
                ) : (
                  <>
                    <Dices className="size-4" /> {t("picker.spin")}
                  </>
                )}
              </Button>
              {candidates.length === 0 ? (
                <p className="text-danger mt-4 text-sm">{t("picker.noFit")}</p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

type FilterLabelProps = {
  children?: React.ReactNode;
  icon: LucideIcon;
  label: string;
};

/**
 * Shared icon-and-label treatment for every picker filter.
 *
 * @param root0 - Component or function properties.
 * @param root0.children - The 'children' property.
 * @param root0.icon - The 'icon' property.
 * @param root0.label - The 'label' property.
 */
function FilterLabel({ children, icon, label }: FilterLabelProps): ReactNode {
  return (
    <span className="mb-3 flex items-center justify-between gap-3 text-sm font-bold">
      <span className="flex items-center gap-3">
        <FilterIcon icon={icon} />
        {label}
      </span>
      {children}
    </span>
  );
}

type FilterIconProps = {
  icon: LucideIcon;
  tone?: "danger" | "primary";
};

/**
 * Consistent compact icon tile used across filter rows.
 *
 * @param root0 - Component or function properties.
 * @param root0.icon - The 'icon' property.
 * @param root0.tone - The 'tone' property.
 */
function FilterIcon({
  icon: Icon,
  tone = "primary",
}: FilterIconProps): ReactNode {
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone === "danger" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

type PossibleGamesDialogProps = {
  candidates: ReelGame[];
  onSelect: (gameId: string) => void;
};

/**
 * Opens the complete eligible-game set as a responsive cover gallery.
 *
 * @param root0 - Component or function properties.
 * @param root0.candidates - The 'candidates' property.
 * @param root0.onSelect - The 'onSelect' property.
 */
function PossibleGamesDialog({
  candidates,
  onSelect,
}: PossibleGamesDialogProps): ReactNode {
  const t = useTranslations();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="bg-background/90 hover:border-primary/40 hover:bg-background group flex w-full max-w-sm items-center gap-3 rounded-2xl border px-3 py-2.5 text-left shadow-lg backdrop-blur-md transition sm:px-4"
          type="button"
        >
          <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-xl shadow-sm">
            <LayoutGrid className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">
              {t("picker.possibleGames", { count: candidates.length })}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              {t("picker.viewPossibleGames")}
            </span>
          </span>
          <ChevronDown className="text-muted-foreground size-4 -rotate-90 transition-transform group-hover:translate-x-0.5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="edit-dialog-overlay fixed inset-0 z-90 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-91 flex max-h-[calc(100dvh-0.5rem)] flex-col overflow-hidden rounded-t-3xl border shadow-2xl focus:outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[min(86vh,50rem)] sm:w-[min(calc(100vw-2rem),58rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-2xl">
                <LayoutGrid className="size-5" />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="font-display text-xl font-bold sm:text-2xl">
                  {t("picker.possibleGamesTitle")}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                  {t("picker.possibleGamesDescription", {
                    count: candidates.length,
                  })}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label={t("common.close")}
                className="hover:bg-muted grid size-10 shrink-0 place-items-center rounded-xl transition"
                type="button"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          {candidates.length > 0 ? (
            <div className="filter-options grid min-h-0 grid-cols-2 gap-3 overflow-y-auto overscroll-contain p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-4">
              {candidates.map((candidate) => (
                <Dialog.Close asChild key={candidate.gameId}>
                  <button
                    className="group/game hover:bg-muted focus-visible:ring-primary/30 min-w-0 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:outline-none sm:p-3"
                    onClick={() => onSelect(candidate.gameId)}
                    type="button"
                  >
                    <GameArtwork
                      className="rounded-xl shadow-md transition group-hover/game:shadow-xl"
                      imageUrl={candidate.imageUrl ?? null}
                      name={candidate.name}
                    />
                    <span className="mt-3 line-clamp-2 block px-1 text-sm leading-tight font-bold">
                      {candidate.name}
                    </span>
                  </button>
                </Dialog.Close>
              ))}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center p-8 text-center">
              <div>
                <ListFilter className="text-muted-foreground mx-auto size-8" />
                <p className="text-muted-foreground mt-3 text-sm">
                  {t("picker.noFit")}
                </p>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type CoverReelProps = {
  candidates: ReelGame[];
  cardRef: React.RefObject<HTMLDivElement | null>;
  onComplete: () => void;
  reduceMotion: boolean;
  reelRun: ReelRun | null;
  spinning: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Displays eligible covers and decelerates the active run beneath the marker.
 *
 * @param root0 - Component or function properties.
 * @param root0.candidates - The 'candidates' property.
 * @param root0.cardRef - The 'cardRef' property.
 * @param root0.onComplete - The 'onComplete' property.
 * @param root0.reduceMotion - The 'reduceMotion' property.
 * @param root0.reelRun - The 'reelRun' property.
 * @param root0.spinning - The 'spinning' property.
 * @param root0.trackRef - The 'trackRef' property.
 */
function CoverReel({
  candidates,
  cardRef,
  onComplete,
  reduceMotion,
  reelRun,
  spinning,
  trackRef,
}: CoverReelProps): ReactNode {
  const idleItems = candidates.slice(0, 8);
  const items = reelRun?.items ?? idleItems;
  const cards = items.map((game, index) => (
    <div
      className="w-28 shrink-0 sm:w-36 lg:w-40"
      key={`${game.gameId}-${index}`}
      ref={index === 0 ? cardRef : undefined}
    >
      <GameArtwork
        className="ring-card shadow-lg ring-4"
        eager={index < 5}
        imageUrl={game.imageUrl ?? null}
        name={game.name}
      />
      <p className="mt-3 line-clamp-2 text-sm leading-tight font-bold">
        {game.name}
      </p>
    </div>
  ));

  return (
    <div className="relative mx-auto h-48 w-full max-w-3xl overflow-hidden sm:h-60">
      <div className="from-card pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-linear-to-r to-transparent sm:w-24" />
      <div className="from-card pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-linear-to-l to-transparent sm:w-24" />
      <div className="bg-accent/10 ring-accent pointer-events-none absolute top-1/2 left-1/2 z-30 h-[calc(100%-0.75rem)] w-32 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-3 border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)] shadow-xl ring-4 sm:w-40 lg:w-44" />
      {reelRun ? (
        <motion.div
          animate={{ x: reelRun.targetX }}
          aria-busy={spinning}
          aria-live="polite"
          className="absolute top-1/2 left-1/2 flex -translate-y-1/2 gap-3 sm:gap-4"
          initial={{ x: reelRun.startX }}
          key={reelRun.id}
          onAnimationComplete={onComplete}
          ref={trackRef}
          transition={{
            duration: reduceMotion ? 0.01 : 2.4,
            ease: [0.12, 0.7, 0.1, 1],
          }}
        >
          {cards}
        </motion.div>
      ) : (
        <div
          className="absolute top-1/2 left-1/2 flex -translate-x-14 -translate-y-1/2 gap-3 sm:-translate-x-18 sm:gap-4 lg:-translate-x-20"
          ref={trackRef}
        >
          {cards}
        </div>
      )}
    </div>
  );
}

/**
 * Creates a bounded reel with the selected game placed near its far end.
 *
 * @param candidates - The 'candidates' value.
 * @param winnerId - The 'winnerId' value.
 */
function buildReelSequence(
  candidates: ReelGame[],
  winnerId: string,
): { items: ReelGame[]; winnerIndex: number } {
  const itemCount = Math.max(20, Math.min(32, candidates.length * 4));
  const winnerIndex = itemCount - 3;
  const start = Math.floor(Math.random() * candidates.length);
  const winner = candidates.find((game) => game.gameId === winnerId);
  const items = Array.from(
    { length: itemCount },
    (_, index) => candidates[(start + index) % candidates.length]!,
  );
  if (winner) items[winnerIndex] = winner;
  return { items, winnerIndex };
}

/**
 * Reads the rendered responsive card step before starting an animation.
 *
 * @param card - The 'card' value.
 * @param track - The 'track' value.
 */
function getReelMetrics(
  card: HTMLDivElement | null,
  track: HTMLDivElement | null,
): { cardWidth: number; gap: number } {
  const wide = window.matchMedia("(min-width: 1024px)").matches;
  const medium = window.matchMedia("(min-width: 640px)").matches;
  return {
    cardWidth:
      card?.getBoundingClientRect().width ?? (wide ? 160 : medium ? 144 : 112),
    gap: track
      ? Number.parseFloat(window.getComputedStyle(track).columnGap)
      : medium
        ? 16
        : 12,
  };
}

/**
 * Builds localized picker facets with occurrence counts for quick scanning.
 *
 * @param games - The candidate games.
 * @param facet - The 'facet' value.
 * @param locale - The 'locale' value.
 */
function pickerOptions(
  games: CollectionGame[],
  facet: "mechanic" | "theme",
  locale: string,
): MultiSelectOption[] {
  const options = new Map<string, { count: number; label: string }>();
  for (const game of games) {
    const categories = game.categories.filter(
      (category) => !isExpansionCategory(category),
    );
    const values =
      facet === "mechanic" ? game.mechanics : [...categories, ...game.families];
    for (const value of new Set(values)) {
      const existing = options.get(value);
      const isCategory = categories.includes(value);
      options.set(value, {
        count: (existing?.count ?? 0) + 1,
        label:
          existing?.label ??
          (facet === "mechanic" || isCategory
            ? getTaxonomyLabel(
                value,
                facet === "mechanic" ? "mechanic" : "category",
                locale,
              )
            : value),
      });
    }
  }

  return [...options]
    .map(([value, option]) => ({ value, ...option }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
}
