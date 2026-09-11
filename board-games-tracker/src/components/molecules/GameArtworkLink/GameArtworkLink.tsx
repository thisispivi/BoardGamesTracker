"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import type { CollectionGame } from "@/core";
import { cn } from "@/utils/cn";

/** Artwork size and game used by the BoardGameGeek artwork link. */
type GameArtworkLinkProps = {
  className?: string;
  eager?: boolean;
  game: CollectionGame;
};

/**
 * Links the uncovered box art to its BoardGameGeek page.
 *
 * Nothing is drawn over the artwork, so the box stays readable at the small
 * sizes the library cards use; every action lives beside the image instead.
 *
 * @param root0 - Properties that configure the artwork link.
 * @param root0.className - Optional classes merged with the artwork size.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.game - Game record whose artwork and identity are linked.
 * @returns Linked artwork sized by the caller.
 */
export function GameArtworkLink({
  className,
  eager = false,
  game,
}: GameArtworkLinkProps): ReactNode {
  const t = useTranslations();
  return (
    <Tooltip content={t("game.openBgg")}>
      <a
        aria-label={t("game.openBggAria", { name: game.name })}
        className={cn(
          "ring-primary/50 block min-w-0 shrink-0 self-start rounded-lg ring-offset-2 ring-offset-transparent transition hover:ring-2",
          className,
        )}
        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <GameArtwork
          className="rounded-lg"
          eager={eager}
          imageUrl={game.imageUrl}
          name={game.name}
        />
      </a>
    </Tooltip>
  );
}
