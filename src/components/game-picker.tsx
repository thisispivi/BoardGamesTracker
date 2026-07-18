"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Clock3,
  Dices,
  Heart,
  ListFilter,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { GameArtwork } from "@/components/game-artwork";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { filterGames, pickRandomGame } from "@/server/picker";
import type { CollectionGame } from "@/components/game-card";
import { formatDuration } from "@/lib/utils";

/** Animated filter-and-spin experience for choosing a collection game. */
export function GamePicker({ games }: { games: CollectionGame[] }) {
  const t = useI18n();
  const [players, setPlayers] = useState(4);
  const [maxMinutes, setMaxMinutes] = useState(120);
  const [maxWeight, setMaxWeight] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [taxonomy, setTaxonomy] = useState("all");
  const [rotation, setRotation] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const filters = {
    players,
    maxMinutes,
    maxWeight,
    favoritesOnly,
    taxonomy: taxonomy === "all" ? "" : taxonomy,
  };
  const pickable = useMemo(
    () =>
      games
        .filter(
          (game) =>
            !game.categories.some(
              (category) => category.toLowerCase() === "expansion",
            ),
        )
        .map((game) => ({
          gameId: game.gameId,
          name: game.name,
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
  const taxonomyOptions = useMemo(
    () =>
      [
        ...new Set(
          pickable.flatMap((game) => [
            ...(game.categories ?? []),
            ...(game.mechanics ?? []),
            ...(game.families ?? []),
          ]),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [pickable],
  );
  const candidates = filterGames(pickable, filters);
  const selected = games.find((game) => game.gameId === selectedId) ?? null;

  /** Spins the visual wheel before revealing a random eligible game. */
  function spin(): void {
    if (candidates.length === 0 || spinning) {
      return;
    }

    setSelectedId(null);
    setSpinning(true);
    setRotation((value) => value + 1440 + Math.floor(Math.random() * 360));
    const picked = pickRandomGame(pickable, filters);
    window.setTimeout(() => {
      setSelectedId(picked?.gameId ?? null);
      setSpinning(false);
    }, 1700);
  }

  if (games.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed p-16 text-center">
        <Dices className="text-primary mx-auto size-10" />
        <h2 className="font-display mt-5 text-2xl font-bold">
          {t("picker.emptyTitle")}
        </h2>
        <p className="text-muted-foreground mt-2">{t("picker.emptyBody")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <aside className="bg-card shadow-soft rounded-3xl border p-6 sm:p-7">
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
            <span className="mb-3 flex items-center justify-between text-sm font-bold">
              <span className="flex items-center gap-2">
                <Users className="text-primary size-4" /> {t("picker.players")}
              </span>
              <strong className="bg-muted rounded-full px-3 py-1 text-xs">
                {players}
              </strong>
            </span>
            <input
              type="range"
              min={1}
              max={12}
              value={players}
              onChange={(event) => setPlayers(Number(event.target.value))}
              className="w-full accent-(--primary)"
            />
          </label>
          <label className="block">
            <span className="mb-3 flex items-center justify-between text-sm font-bold">
              <span className="flex items-center gap-2">
                <Clock3 className="text-primary size-4" /> {t("picker.maxTime")}
              </span>
              <strong className="bg-muted rounded-full px-3 py-1 text-xs">
                {maxMinutes === 0
                  ? t("picker.any")
                  : formatDuration(maxMinutes)}
              </strong>
            </span>
            <input
              type="range"
              min={0}
              max={240}
              step={30}
              value={maxMinutes}
              onChange={(event) => setMaxMinutes(Number(event.target.value))}
              className="w-full accent-(--primary)"
            />
          </label>
          <div className="text-sm font-bold">
            <span className="mb-3 block">{t("picker.complexity")}</span>
            <Select
              ariaLabel={t("picker.complexity")}
              value={String(maxWeight)}
              onValueChange={(value) => setMaxWeight(Number(value))}
              options={[
                { value: "0", label: t("picker.anyComplexity") },
                { value: "2", label: t("picker.light") },
                { value: "3", label: t("picker.medium") },
                { value: "4", label: t("picker.heavy") },
              ]}
            />
          </div>
          <div className="text-sm font-bold">
            <span className="mb-3 flex items-center gap-2">
              <ListFilter className="text-primary size-4" />{" "}
              {t("picker.taxonomy")}
            </span>
            <Select
              ariaLabel={t("picker.taxonomyAria")}
              value={taxonomy}
              onValueChange={setTaxonomy}
              options={[
                { value: "all", label: t("picker.anyTaxonomy") },
                ...taxonomyOptions.map((value) => ({ value, label: value })),
              ]}
            />
          </div>
          <label className="bg-muted/70 flex cursor-pointer items-center justify-between rounded-xl p-4 text-sm font-bold">
            <span className="flex items-center gap-2">
              <Heart className="text-danger size-4" />{" "}
              {t("picker.favoritesOnly")}
            </span>
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(event) => setFavoritesOnly(event.target.checked)}
              className="size-4 accent-(--primary)"
            />
          </label>
        </div>
        <div className="mt-7 border-t pt-5">
          <p className="text-center text-sm">
            {t(
              candidates.length === 1 ? "picker.matchOne" : "picker.matchMany",
              { count: candidates.length },
            )}
          </p>
          <div className="mt-4 max-h-52 space-y-1 overflow-y-auto overscroll-contain pr-1">
            {candidates.map((candidate) => (
              <button
                key={candidate.gameId}
                type="button"
                onClick={() => setSelectedId(candidate.gameId)}
                className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition"
              >
                <span className="bg-primary/10 text-primary grid size-6 shrink-0 place-items-center rounded-md">
                  <Dices className="size-3" />
                </span>
                <span className="truncate">{candidate.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="bg-card shadow-soft relative grid min-h-[570px] place-items-center overflow-hidden rounded-3xl border p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--primary)_17%,transparent),transparent_48%)] opacity-50" />
        <AnimatePresence mode="wait">
          {selected && !spinning ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full max-w-sm text-center"
            >
              <p className="text-accent mb-4 text-xs font-bold tracking-[0.2em] uppercase">
                {t("picker.tonight")}
              </p>
              <GameArtwork
                name={selected.name}
                imageUrl={selected.imageUrl}
                className="shadow-2xl"
              />
              <h2 className="font-display mt-6 text-3xl font-bold">
                {selected.name}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {selected.minPlayers}–{selected.maxPlayers} players ·{" "}
                {formatDuration(selected.maxPlaytime)}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={spin}
                className="mt-6"
              >
                <RotateCcw className="size-4" /> {t("picker.spinAgain")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="wheel"
              className="relative z-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative mx-auto size-64 sm:size-80">
                <span className="border-t-accent absolute top-[-14px] left-1/2 z-20 -translate-x-1/2 border-x-14 border-t-26 border-x-transparent drop-shadow" />
                <motion.div
                  animate={{ rotate: rotation }}
                  transition={{ duration: 1.7, ease: [0.12, 0.7, 0.1, 1] }}
                  className="border-card size-full rounded-full border-12 shadow-2xl [background:conic-gradient(var(--primary)_0_45deg,var(--accent)_45deg_90deg,#d8c269_90deg_135deg,#476f91_135deg_180deg,var(--primary)_180deg_225deg,var(--accent)_225deg_270deg,#d8c269_270deg_315deg,#476f91_315deg_360deg)]"
                >
                  <div className="border-card bg-background absolute inset-[28%] grid place-items-center rounded-full border-8">
                    <Dices className="text-primary size-12" />
                  </div>
                </motion.div>
              </div>
              <Button
                type="button"
                size="lg"
                onClick={spin}
                disabled={spinning || candidates.length === 0}
                className="mt-10 min-w-48"
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
              {candidates.length === 0 && (
                <p className="text-danger mt-4 text-sm">{t("picker.noFit")}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
