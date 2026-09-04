"use client";

import { Heart, Link as LinkIcon, Star, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import { GameFacts } from "@/components/molecules/GameFacts/GameFacts";
import { EditGameDialog } from "@/components/organisms/EditGameDialog/EditGameDialog";
import type { CollectionGame } from "@/core";
import {
  removeGameAction,
  toggleFavoriteAction,
} from "@/server/actions/collection";
import { cn } from "@/utils/cn";
import { isExpansionCategory } from "@/utils/gameTaxonomy";

/** Game record used by the optimistic favorite control. */
type FavoriteControlProps = { game: CollectionGame };

/**
 * Favorite toggle shared by full collection cards.
 *
 * @param root0 - Properties that configure favorite control.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns An optimistic favorite toggle for the game.
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
        className={cn(
          "grid size-9 place-items-center rounded-full shadow-sm backdrop-blur transition",
          game.favorite
            ? "bg-accent text-accent-foreground"
            : "bg-card/90 text-muted-foreground hover:text-danger",
        )}
        type="submit"
      >
        <Heart className={cn("size-4", game.favorite && "fill-current")} />
      </button>
    </form>
  );
}

/** Game record used by the collection removal control. */
type RemoveControlProps = { game: CollectionGame };

/**
 * In-app removal confirmation shared by collection card variants.
 *
 * @param root0 - Properties that configure remove control.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns A confirmation control that removes the game.
 */
function RemoveControl({ game }: RemoveControlProps): ReactNode {
  const t = useTranslations();
  return (
    <ConfirmDialog
      action={removeGameAction}
      cancelLabel={t("common.cancel")}
      confirmLabel={t("game.remove")}
      description={t("game.removeBody")}
      fields={{ itemId: game.id }}
      title={t("game.removeTitle", { name: game.name })}
      trigger={
        <button
          aria-label={t("game.removeAria", { name: game.name })}
          className="text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-md p-2 transition"
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      }
    />
  );
}

/** Artwork link state derived from a game and presentation mode. */
type ArtworkLinkProps = {
  eager?: boolean;
  game: CollectionGame;
  compact?: boolean;
};

/**
 * Square artwork with a blurred, keyboard-accessible BGG hover action.
 *
 * @param root0 - Properties that configure artwork link.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.game - Game record displayed or changed by the component.
 * @param root0.compact - Whether to use the condensed presentation.
 * @returns Linked artwork when the BGG URL is valid, otherwise unlinked artwork.
 */
function ArtworkLink({
  eager = false,
  game,
  compact = false,
}: ArtworkLinkProps): ReactNode {
  const t = useTranslations();
  return (
    <div className="group/art relative">
      <GameArtwork
        className={
          compact ? "size-12 shrink-0 rounded-md sm:size-16" : "rounded-lg"
        }
        eager={eager}
        imageClassName="transition duration-300 group-hover/art:scale-105 group-hover/art:blur-sm group-focus-within/art:scale-105 group-focus-within/art:blur-sm"
        imageUrl={game.imageUrl}
        name={game.name}
      />
      <a
        aria-label={t("game.openBggAria", { name: game.name })}
        className={cn(
          "absolute inset-0 grid place-items-center rounded-[inherit] bg-black/35 opacity-0 transition duration-200 group-focus-within/art:opacity-100 group-hover/art:opacity-100",
          compact ? "p-1" : "p-4",
        )}
        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span
          className={cn(
            "flex items-center gap-2 rounded-full bg-white text-sm font-bold text-slate-950 shadow-lg",
            compact ? "p-2" : "px-4 py-2.5",
          )}
        >
          <LinkIcon className="size-4" />
          {!compact ? t("game.openBgg") : null}
        </span>
      </a>
    </div>
  );
}

/** Game taxonomy rendered as localized category pills. */
type TaxonomyPillsProps = { className?: string; game: CollectionGame };

/**
 * Shows a concise mix of scraped BGG categories and mechanics.
 *
 * @param root0 - Properties that configure taxonomy pills.
 * @param root0.className - Optional classes merged with the pill row styles.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns Localized category and mechanic pills for the game.
 */
function TaxonomyPills({ className, game }: TaxonomyPillsProps): ReactNode {
  const categories = game.categories
    .filter((value) => !isExpansionCategory(value))
    .slice(0, 2)
    .map((label) => ({ label, mechanic: false }));
  const mechanics = game.mechanics
    .slice(0, 3)
    .map((label) => ({ label, mechanic: true }));
  const tags = [
    ...new Map(
      [...categories, ...mechanics].map((tag) => [tag.label, tag]),
    ).values(),
  ];
  const total = new Set([
    ...game.categories.filter((value) => !isExpansionCategory(value)),
    ...game.mechanics,
  ]).size;
  if (tags.length === 0) return null;

  return (
    <div className={cn("mt-3 flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span
          className={cn(
            "max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold",
            tag.mechanic
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
          key={tag.label}
          title={tag.label}
        >
          {tag.label}
        </span>
      ))}
      {total > tags.length ? (
        <span className="text-muted-foreground px-1 py-0.5 text-xs font-semibold">
          +{total - tags.length}
        </span>
      ) : null}
    </div>
  );
}

/** Rating value and placement used by the BoardGameGeek score badge. */
type RatingBadgeProps = {
  className?: string;
  rating: number;
};

/**
 * Shows a BoardGameGeek score rounded to a single decimal.
 *
 * @param root0 - Properties that configure the rating badge.
 * @param root0.className - Optional classes merged with the badge styles.
 * @param root0.rating - BoardGameGeek score on its ten-point scale.
 * @returns The rendered rating badge.
 */
function RatingBadge({ className, rating }: RatingBadgeProps): ReactNode {
  const format = useFormatter();
  return (
    <span
      className={cn(
        "bg-muted flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
        className,
      )}
    >
      <Star aria-hidden="true" className="fill-accent text-accent size-3" />
      {format.number(rating, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
    </span>
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
 * Interactive board-game card with embedded, scrollable expansions.
 *
 * @param root0 - Properties that configure game card.
 * @param root0.compact - Whether to use the condensed presentation.
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
  const t = useTranslations();
  if (compact) {
    return (
      <article className="hover:bg-muted/60 flex flex-wrap items-center gap-2 rounded-lg p-1.5 transition duration-200 sm:flex-nowrap sm:gap-3 sm:p-2">
        <ArtworkLink compact game={game} />
        <div className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-auto">
          <h3 className="line-clamp-2 text-xs font-bold sm:text-sm">
            {game.name}
          </h3>
          <p className="text-muted-foreground mt-0.5 truncate text-[0.6875rem] sm:mt-1 sm:text-xs">
            {game.yearPublished ?? t("common.yearUnknown")}
            <CollectionCost currency={currency} game={game} />
          </p>
        </div>
        {readOnly ? null : (
          <div className="ml-auto flex shrink-0 items-center sm:ml-0">
            <EditGameDialog currency={currency} game={game} />
            <RemoveControl game={game} />
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="group bg-card shadow-soft hover:border-primary/30 flex flex-col overflow-hidden rounded-xl border p-2 transition-colors duration-200 sm:p-3">
      <div className="relative">
        <ArtworkLink eager={eager} game={game} />
        {readOnly ? null : (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <FavoriteControl game={game} />
          </div>
        )}
        {game.bggRating !== null ? (
          <RatingBadge
            className="bg-card/90 absolute bottom-2 left-2 shadow-sm backdrop-blur sm:hidden"
            rating={game.bggRating}
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-0.5 pt-2 sm:px-1 sm:pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display line-clamp-2 text-sm font-bold sm:text-lg">
              {game.name}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-[0.6875rem] sm:mt-1 sm:text-xs">
              {game.yearPublished ?? t("common.yearUnknown")}
              <CollectionCost currency={currency} game={game} />
            </p>
          </div>
          {game.bggRating !== null ? (
            <RatingBadge className="hidden sm:flex" rating={game.bggRating} />
          ) : null}
        </div>
        <TaxonomyPills className="hidden sm:flex" game={game} />
        <div className="mt-2 flex min-w-0 flex-col gap-1 border-t pt-2 sm:mt-4 sm:flex-row sm:items-center sm:pt-3">
          <GameFacts
            className="min-w-0 flex-1 gap-x-2.5 sm:gap-x-4"
            game={game}
          />
          {readOnly ? null : (
            <div className="-mx-1 flex shrink-0 items-center justify-end sm:mx-0 sm:ml-2 sm:gap-0.5">
              <EditGameDialog currency={currency} game={game} />
              <RemoveControl game={game} />
            </div>
          )}
        </div>
        {expansions.length > 0 ? (
          <section className="mt-auto border-t pt-2 sm:pt-3">
            <div className="text-muted-foreground flex items-center justify-between gap-2 px-1 pb-1 text-[0.6875rem] font-bold sm:px-2 sm:text-xs">
              <span>{t("game.expansions")}</span>
              <span className="tabular-nums">{expansions.length}</span>
            </div>
            <div className="max-h-44 space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-52">
              {expansions.map((expansion) => (
                <GameCard
                  compact
                  currency={currency}
                  game={expansion}
                  key={expansion.id}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}

/** Game and currency used to display personal purchase cost. */
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
 * @returns The formatted purchase cost, or null when the game was gifted.
 */
function CollectionCost({ currency, game }: CollectionCostProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations();
  if (!game.gifted && game.moneySpent <= 0) return null;

  return (
    <>
      {" · "}
      {game.gifted
        ? t("game.gifted")
        : format.number(game.moneySpent, {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
          })}
    </>
  );
}
