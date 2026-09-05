"use client";

import { Heart } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { GameFacts } from "@/components/molecules/GameFacts/GameFacts";
import { TagRow } from "@/components/molecules/TagRow/TagRow";
import { GameActionsMenu } from "@/components/organisms/GameActionsMenu/GameActionsMenu";
import type { CollectionGame } from "@/core";
import { toggleFavoriteAction } from "@/server/actions/collection";
import { cn } from "@/utils/cn";
import { buildGameTags } from "@/utils/gameTags";

/** Game record used by the optimistic favorite control. */
type FavoriteControlProps = { game: CollectionGame };

/**
 * Favorite toggle placed beside the card actions rather than over the artwork.
 *
 * @param root0 - Properties that configure favorite control.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns A favorite toggle for the game.
 */
function FavoriteControl({ game }: FavoriteControlProps): ReactNode {
  const t = useTranslations();
  return (
    <form action={toggleFavoriteAction}>
      <input name="itemId" type="hidden" value={game.id} />
      <input name="favorite" type="hidden" value={String(!game.favorite)} />
      <button
        aria-label={
          game.favorite ? t("game.removeFavorite") : t("game.addFavorite")
        }
        aria-pressed={game.favorite}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full transition",
          game.favorite
            ? "text-accent hover:bg-accent/10"
            : "text-muted-foreground hover:bg-muted hover:text-accent",
        )}
        type="submit"
      >
        <Heart className={cn("size-4", game.favorite && "fill-current")} />
      </button>
    </form>
  );
}

/** Game and currency used to display the recorded purchase cost. */
type CollectionCostProps = {
  currency: string;
  game: CollectionGame;
};

/**
 * Renders a recorded price or the gifted label without implying a zero price.
 *
 * @param root0 - Properties that configure collection cost.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns The formatted purchase cost, or null when no price was recorded.
 */
function CollectionCost({ currency, game }: CollectionCostProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations();
  if (!game.gifted && game.moneySpent <= 0) return null;

  return (
    <>
      <span aria-hidden="true">·</span>
      <span className="text-foreground font-semibold">
        {game.gifted
          ? t("game.gifted")
          : format.number(game.moneySpent, {
              style: "currency",
              currency,
              maximumFractionDigits: 2,
            })}
      </span>
    </>
  );
}

/** Artwork size and game used by the BoardGameGeek artwork link. */
type ArtworkLinkProps = {
  className?: string;
  eager?: boolean;
  game: CollectionGame;
};

/**
 * Links the uncovered box art to its BoardGameGeek page.
 *
 * Nothing is drawn over the artwork, so the box stays readable at the small
 * sizes this card uses; every action lives beside the image instead.
 *
 * @param root0 - Properties that configure the artwork link.
 * @param root0.className - Optional classes merged with the artwork size.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns Linked artwork sized by the caller.
 */
function ArtworkLink({
  className,
  eager = false,
  game,
}: ArtworkLinkProps): ReactNode {
  const t = useTranslations();
  return (
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
  );
}

/** Game, currency, and permissions used by one expansion row. */
type ExpansionRowProps = {
  currency: string;
  game: CollectionGame;
  readOnly: boolean;
};

/**
 * Compact expansion line showing artwork, year, price, and its own actions.
 *
 * @param root0 - Properties that configure the expansion row.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.game - Expansion record displayed or changed by the component.
 * @param root0.readOnly - Whether mutation controls must be omitted.
 * @returns The rendered expansion row.
 */
function ExpansionRow({
  currency,
  game,
  readOnly,
}: ExpansionRowProps): ReactNode {
  const t = useTranslations();
  return (
    <div className="hover:bg-card flex items-center gap-2.5 rounded-lg p-1 transition">
      <ArtworkLink className="w-10 sm:w-11" game={game} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{game.name}</p>
        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-[0.6875rem]">
          <span>{game.yearPublished ?? t("common.yearUnknown")}</span>
          <CollectionCost currency={currency} game={game} />
        </p>
      </div>
      {readOnly ? null : <GameActionsMenu currency={currency} game={game} />}
    </div>
  );
}

/** Game data, related expansions, and permissions shown by a card. */
type GameCardProps = {
  compact?: boolean;
  currency: string;
  eager?: boolean;
  expansions?: CollectionGame[];
  game: CollectionGame;
  readOnly?: boolean;
};

/**
 * Horizontal board-game card with a small cover, a measured tag row, and its expansions.
 *
 * The artwork is deliberately thumbnail sized: the card is a scannable index
 * entry, and the facts, taxonomy, and actions are what the collection is
 * browsed by.
 *
 * @param root0 - Properties that configure game card.
 * @param root0.compact - Whether to render the single-line expansion presentation.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.expansions - Expansion entries associated with the base game.
 * @param root0.game - Game record displayed or changed by the component.
 * @param root0.readOnly - Whether mutation controls must be omitted.
 * @returns The rendered game card.
 */
export function GameCard({
  compact = false,
  currency,
  eager = false,
  expansions = [],
  game,
  readOnly = false,
}: GameCardProps): ReactNode {
  const locale = useLocale();
  const t = useTranslations();
  const tags = useMemo(() => buildGameTags(game, locale), [game, locale]);

  if (compact) {
    return (
      <article className="bg-card shadow-soft hover:border-primary/30 rounded-xl border p-1.5 transition-colors duration-200">
        <ExpansionRow currency={currency} game={game} readOnly={readOnly} />
      </article>
    );
  }

  return (
    <article className="bg-card shadow-soft hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border transition-colors duration-200">
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <ArtworkLink className="w-20 sm:w-24" eager={eager} game={game} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-start gap-1">
            <div className="min-w-0 flex-1">
              <h2 className="font-display line-clamp-2 text-sm leading-snug font-bold sm:text-base">
                {game.name}
              </h2>
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1 text-xs">
                <span>{game.yearPublished ?? t("common.yearUnknown")}</span>
                <CollectionCost currency={currency} game={game} />
              </p>
            </div>
            {readOnly ? null : (
              <div className="-mt-1 -mr-1 flex shrink-0 items-center">
                <FavoriteControl game={game} />
                <GameActionsMenu currency={currency} game={game} />
              </div>
            )}
          </div>
          <TagRow className="mt-2.5" tags={tags} />
          <GameFacts className="mt-2.5 border-t pt-2.5" game={game} />
        </div>
      </div>
      {expansions.length > 0 ? (
        <section className="bg-muted/40 border-t px-2 py-2 sm:px-3">
          <div className="text-muted-foreground flex items-center justify-between gap-2 px-1 pb-1 text-[0.6875rem] font-bold tracking-wide uppercase">
            <span>{t("game.expansions")}</span>
            <span className="tabular-nums">{expansions.length}</span>
          </div>
          <div className="max-h-40 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
            {expansions.map((expansion) => (
              <ExpansionRow
                currency={currency}
                game={expansion}
                key={expansion.id}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
