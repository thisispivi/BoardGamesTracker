"use client";

import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";

import { GameArtworkLink } from "@/components/molecules/GameArtworkLink/GameArtworkLink";
import { GameFacts } from "@/components/molecules/GameFacts/GameFacts";
import { GameTitle } from "@/components/molecules/GameTitle/GameTitle";
import { TagRow } from "@/components/molecules/TagRow/TagRow";
import type { CollectionGame } from "@/core";
import { buildGameTags } from "@/utils/gameTags";

/** Game, its library-specific controls, and an optional footer section. */
type GameCardShellProps = {
  actions?: ReactNode;
  children?: ReactNode;
  eager: boolean;
  game: CollectionGame;
  meta?: ReactNode;
};

/**
 * Horizontal card layout shared by the collection and the wishlist.
 *
 * The artwork is deliberately thumbnail sized: the card is a scannable index
 * entry, and the facts, taxonomy, and actions are what a library is browsed by.
 *
 * @param root0 - Card content.
 * @param root0.actions - Icon controls aligned beside the title, if any.
 * @param root0.children - Section rendered below the card body, such as expansions.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.game - Game whose artwork, title, tags, and facts are shown.
 * @param root0.meta - Extra details appended after the publication year.
 * @returns The rendered card.
 */
export function GameCardShell({
  actions,
  children,
  eager,
  game,
  meta,
}: GameCardShellProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const tags = useMemo(() => buildGameTags(game, locale), [game, locale]);

  return (
    <article className="bg-card shadow-soft hover:border-accent/50 flex flex-col overflow-hidden rounded-xl border transition-colors duration-200">
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <GameArtworkLink
          artworkClassName="h-full w-full"
          className="aspect-square min-h-20 self-stretch sm:min-h-24"
          eager={eager}
          game={game}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-start gap-1">
            <div className="min-w-0 flex-1">
              <GameTitle
                className="font-display text-sm leading-snug font-bold sm:text-base"
                name={game.name}
              />
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1 text-xs">
                <span>{game.yearPublished ?? t("common.yearUnknown")}</span>
                {meta}
              </p>
            </div>
            {actions ? (
              <div className="-mt-1 -mr-1 flex shrink-0 items-center">
                {actions}
              </div>
            ) : null}
          </div>
          <TagRow className="mt-2.5" tags={tags} />
          <GameFacts className="mt-2.5 border-t pt-2.5" game={game} />
        </div>
      </div>
      {children}
    </article>
  );
}
