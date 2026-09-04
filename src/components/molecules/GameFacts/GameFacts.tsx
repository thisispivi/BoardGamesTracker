"use client";

import { Clock3, Gauge, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { CollectionGame } from "@/core";
import { useDurationFormatter } from "@/hooks/useDurationFormatter";
import { cn } from "@/utils/cn";

/** Game metadata and optional presentation classes rendered in a compact row. */
type GameFactsProps = {
  className?: string;
  game: CollectionGame;
};

/**
 * Shows player count, maximum playtime, and full-precision BGG complexity.
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
        "text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs tabular-nums",
        className,
      )}
      role="list"
    >
      <span
        aria-label={t("playerCount", { count: playerCount })}
        role="listitem"
      >
        <span aria-hidden="true" className="flex items-center gap-1.5">
          <Users className="size-3.5" />
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
          <Clock3 className="size-3.5" />
          {formatDuration(game.maxPlaytime)}
        </span>
      </span>
      {game.weight !== null ? (
        <span
          aria-label={t("weight", {
            weight: format.number(game.weight, {
              maximumFractionDigits: 5,
              minimumFractionDigits: 2,
            }),
          })}
          role="listitem"
        >
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            {format.number(game.weight, {
              maximumFractionDigits: 5,
              minimumFractionDigits: 2,
            })}
          </span>
        </span>
      ) : null}
    </div>
  );
}
