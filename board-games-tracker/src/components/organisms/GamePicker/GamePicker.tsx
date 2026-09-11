"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronDown,
  Dices,
  LayoutGrid,
  ListFilter,
  RotateCcw,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useRef, useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { GameFilters } from "@/components/molecules/GameFilters/GameFilters";
import type { CollectionGame, LibraryFilters } from "@/core";
import { useDurationFormatter } from "@/hooks/useDurationFormatter";
import {
  createLibraryFilters,
  filterAndSortLibraryGames,
} from "@/utils/libraryFilters";
import { pickRandomGame } from "@/utils/picker";

/** A game duplicated into the animated picker reel. */
type ReelGame = {
  gameId: string;
  imageUrl?: string | null;
  name: string;
};

/** Prepared reel sequence, winner, and animation identity for one spin. */
type ReelRun = {
  id: number;
  items: ReelGame[];
  startX: number;
  targetX: number;
  winnerId: string;
};

/** Collection games available to the game-night picker. */
type GamePickerProps = { games: CollectionGame[] };

/**
 * Animated filter-and-reel experience for choosing a collection game.
 *
 * @param root0 - Properties that configure game picker.
 * @param root0.games - Game records available to the component.
 * @returns The rendered game picker.
 */
export function GamePicker({ games }: GamePickerProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const formatDuration = useDurationFormatter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<LibraryFilters>(() => ({
    ...createLibraryFilters(),
    gameType: "baseGames",
  }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [reelRun, setReelRun] = useState<ReelRun | null>(null);
  const reelCardRef = useRef<HTMLDivElement>(null);
  const reelStageRef = useRef<HTMLElement>(null);
  const reelTrackRef = useRef<HTMLDivElement>(null);
  const reelRunId = useRef(0);
  const candidates = useMemo(
    () => filterAndSortLibraryGames(games, filters, locale),
    [filters, games, locale],
  );
  const selected = games.find((game) => game.gameId === selectedId) ?? null;

  /**
   * Runs a cover reel that decelerates onto a preselected eligible game.
   *
   * @returns Nothing.
   */
  function spin(): void {
    if (candidates.length === 0 || spinning) {
      return;
    }

    const picked = pickRandomGame(candidates);
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
   * Reveals a manually chosen candidate and scrolls the stage below the filters into view.
   *
   * @param gameId - Stable identifier of the chosen game.
   * @returns Nothing.
   */
  function selectCandidate(gameId: string): void {
    setSelectedId(gameId);
    reelStageRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center sm:p-16">
        <Dices className="text-primary mx-auto size-10" />
        <h2 className="font-display mt-5 text-2xl font-bold">
          {t("picker.emptyTitle")}
        </h2>
        <p className="text-muted-foreground mt-2">{t("picker.emptyBody")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <GameFilters
        filters={filters}
        games={games}
        onChange={setFilters}
        showBrowseControls
        showFavorites
        showPlayed
      />

      <section
        className="bg-card shadow-soft relative grid min-h-117.5 min-w-0 scroll-mt-24 place-items-center overflow-hidden rounded-xl border px-4 pt-20 pb-5 sm:min-h-142.5 sm:px-6 sm:pt-24 sm:pb-6"
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

/** Eligible games and selection callback used by the candidate dialog. */
type PossibleGamesDialogProps = {
  candidates: ReelGame[];
  onSelect: (gameId: string) => void;
};

/**
 * Opens the complete eligible-game set as a responsive cover gallery.
 *
 * @param root0 - Properties that configure possible games dialog.
 * @param root0.candidates - Games eligible for display or selection.
 * @param root0.onSelect - Callback invoked with the selected game identifier.
 * @returns A dialog listing games that satisfy the current filters.
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
          className="bg-background/90 hover:border-primary/40 hover:bg-background group flex w-full max-w-sm items-center gap-3 rounded-lg border px-3 py-2.5 text-left shadow-lg backdrop-blur-md transition sm:px-4"
          type="button"
        >
          <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg shadow-sm">
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
        <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-91 flex max-h-[calc(100dvh-0.5rem)] flex-col overflow-hidden rounded-t-xl border shadow-2xl focus:outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[min(86vh,50rem)] sm:w-[min(calc(100vw-2rem),58rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-lg">
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
                className="hover:bg-muted grid size-10 shrink-0 place-items-center rounded-lg transition"
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
                    className="group/game hover:bg-muted hover:border-primary/40 min-w-0 rounded-lg border p-2 text-left transition-colors sm:p-3"
                    onClick={() => onSelect(candidate.gameId)}
                    type="button"
                  >
                    <GameArtwork
                      className="rounded-lg shadow-md transition group-hover/game:shadow-xl"
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

/** Prepared animation state and element references used by the cover reel. */
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
 * @param root0 - Properties that configure cover reel.
 * @param root0.candidates - Games eligible for display or selection.
 * @param root0.cardRef - Reference that receives the winning card element.
 * @param root0.onComplete - Callback invoked after the reel settles on a winner.
 * @param root0.reduceMotion - Whether the operating system requests reduced animation.
 * @param root0.reelRun - Prepared reel sequence and winner for the current spin.
 * @param root0.spinning - Whether the reel animation is in progress.
 * @param root0.trackRef - Reference that receives the reel track element.
 * @returns The animated cover reel or its stable pre-spin state.
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
      <div className="bg-accent/10 ring-accent pointer-events-none absolute top-1/2 left-1/2 z-30 h-[calc(100%-0.75rem)] w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border-3 border-[color-mix(in_srgb,var(--accent)_60%,transparent)] shadow-xl ring-4 sm:w-40 lg:w-44" />
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
 * @param candidates - Games eligible for the reel.
 * @param winnerId - Stable identifier of the selected winner.
 * @returns A repeated reel sequence and the index of its final winner.
 */
function buildReelSequence(
  candidates: ReelGame[],
  winnerId: string,
): { items: ReelGame[]; winnerIndex: number } {
  if (candidates.length === 0) {
    return { items: [], winnerIndex: 0 };
  }

  const itemCount = Math.max(20, Math.min(32, candidates.length * 4));
  const winnerIndex = itemCount - 3;
  const start = Math.floor(Math.random() * candidates.length);
  const items: ReelGame[] = [];
  for (let index = 0; index < itemCount; index += 1) {
    const game = candidates[(start + index) % candidates.length];
    if (game) items.push(game);
  }
  const winner = candidates.find((game) => game.gameId === winnerId);
  if (winner) items[winnerIndex] = winner;
  return { items, winnerIndex };
}

/**
 * Reads the rendered responsive card step before starting an animation.
 *
 * @param card - Winning card element used to calculate its final position.
 * @param track - Reel track element whose translation is calculated.
 * @returns Measured card width and inter-card gap for reel positioning.
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
