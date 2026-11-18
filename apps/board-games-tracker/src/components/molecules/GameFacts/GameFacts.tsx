"use client";

import { Brain, Clock3, Star, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { CollectionGame } from "@/core";
import { useDurationFormatter } from "@/hooks/useDurationFormatter";
import { cn } from "@/utils/cn";
import { weightNumberFormat } from "@/utils/weightFormat";

/** Game metadata and optional presentation classes rendered in a compact row. */
type GameFactsProps = {
  className?: string;
  game: CollectionGame;
};

/**
 * Shows player count, playtime, BGG complexity, and the BGG community score.
 *
 * Complexity keeps every meaningful decimal BoardGameGeek publishes, because
 * the bands used elsewhere in the app are derived from that exact value.
 *
 * @param root0 - Properties that configure the metadata row.
 * @param root0.className - Optional classes merged with the row styles.
 * @param root0.game - Game whose table requirements are summarized.
 * @returns A compact, accessible list of game facts.
 */
export function GameFacts({ className, game }: GameFactsProps): ReactNode {
  const format = useFormatter();
  const formatDuration = useDurationFormatter();
  const t = useTranslations("game");
  const playerCount =
    game.minPlayers === game.maxPlayers
      ? String(game.minPlayers)
      : `${game.minPlayers}–${game.maxPlayers}`;

  return (
    <div
      aria-label={t("facts")}
      className={cn(
        "text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium tabular-nums",
        className,
      )}
      role="list"
    >
      <span
        aria-label={t("playerCount", { count: playerCount })}
        role="listitem"
      >
        <span aria-hidden="true" className="flex items-center gap-1.5">
          <Users className="size-3.5 shrink-0" />
          {playerCount}
        </span>
      </span>
      <span
        aria-label={t("playtime", {
          duration: formatDuration(game.maxPlaytime),
        })}
        role="listitem"
      >
        <span aria-hidden="true" className="flex items-center gap-1.5">
          <Clock3 className="size-3.5 shrink-0" />
          {formatDuration(game.maxPlaytime)}
        </span>
      </span>
      {game.weight !== null ? (
        <span
          aria-label={t("weight", {
            weight: format.number(game.weight, weightNumberFormat),
          })}
          role="listitem"
        >
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <Brain className="size-3.5 shrink-0" />
            {format.number(game.weight, weightNumberFormat)}
          </span>
        </span>
      ) : null}
      {game.bggRating !== null ? (
        <span
          aria-label={t("rating", {
            rating: format.number(game.bggRating, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            }),
          })}
          className="text-foreground font-bold"
          role="listitem"
        >
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <Star className="fill-accent text-accent size-3.5 shrink-0" />
            {format.number(game.bggRating, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            })}
          </span>
        </span>
      ) : null}
    </div>
  );
}
