"use client";

import {
  Clock3,
  Heart,
  Link as LinkIcon,
  Star,
  Trash2,
  Users,
} from "lucide-react";

import { EditGameDialog } from "@/components/edit-game-dialog";
import { GameArtwork } from "@/components/game-artwork";
import { useI18n } from "@/components/i18n-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMoney } from "@/lib/currency";
import { isExpansionCategory } from "@/lib/game-taxonomy";
import { formatDuration } from "@/lib/utils";
import {
  removeGameAction,
  toggleFavoriteAction,
} from "@/server/actions/collection";

/** Serialized collection game rendered by the browser. */
export type CollectionGame = {
  id: string;
  favorite: boolean;
  personalRating: number | null;
  notes: string;
  moneySpent: number;
  gameId: string;
  bggId: number;
  name: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  minPlaytime: number;
  maxPlaytime: number;
  weight: number | null;
  bggRating: number | null;
  isExpansion: boolean;
  categories: string[];
  mechanics: string[];
  families: string[];
};

/** Favorite toggle shared by full collection cards. */
function FavoriteControl({ game }: { game: CollectionGame }) {
  const t = useI18n();
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="itemId" value={game.id} />
      <input type="hidden" name="favorite" value={String(!game.favorite)} />
      <button
        type="submit"
        aria-label={
          game.favorite ? t("game.removeFavorite") : t("game.addFavorite")
        }
        className={`grid size-9 place-items-center rounded-full shadow-sm backdrop-blur transition ${game.favorite ? "bg-accent text-accent-foreground" : "bg-card/90 text-muted-foreground hover:text-danger"}`}
      >
        <Heart className={`size-4 ${game.favorite ? "fill-current" : ""}`} />
      </button>
    </form>
  );
}

/** In-app removal confirmation shared by collection card variants. */
function RemoveControl({ game }: { game: CollectionGame }) {
  const t = useI18n();
  return (
    <ConfirmDialog
      action={removeGameAction}
      title={t("game.removeTitle", { name: game.name })}
      description={t("game.removeBody")}
      confirmLabel={t("game.remove")}
      cancelLabel={t("common.cancel")}
      fields={{ itemId: game.id }}
      trigger={
        <button
          type="button"
          aria-label={t("game.removeAria", { name: game.name })}
          className="text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg p-2 transition"
        >
          <Trash2 className="size-4" />
        </button>
      }
    />
  );
}

/** Square artwork with a blurred, keyboard-accessible BGG hover action. */
function ArtworkLink({
  eager = false,
  game,
  compact = false,
}: {
  eager?: boolean;
  game: CollectionGame;
  compact?: boolean;
}) {
  const t = useI18n();
  return (
    <div className="group/art relative">
      <GameArtwork
        eager={eager}
        name={game.name}
        imageUrl={game.imageUrl}
        className={
          compact
            ? "size-14 shrink-0 rounded-[0.75rem] sm:size-16"
            : "rounded-[1.2rem]"
        }
        imageClassName="transition duration-300 group-hover/art:scale-105 group-hover/art:blur-sm group-focus-within/art:scale-105 group-focus-within/art:blur-sm"
      />
      <a
        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("game.openBggAria", { name: game.name })}
        className={`absolute inset-0 grid place-items-center rounded-[inherit] bg-black/35 opacity-0 transition duration-200 group-focus-within/art:opacity-100 group-hover/art:opacity-100 ${compact ? "p-1" : "p-4"}`}
      >
        <span
          className={`flex items-center gap-2 rounded-full bg-white text-sm font-bold text-slate-950 shadow-lg ${compact ? "p-2" : "px-4 py-2.5"}`}
        >
          <LinkIcon className="size-4" />
          {!compact && t("game.openBgg")}
        </span>
      </a>
    </div>
  );
}

/** Shows a concise mix of scraped BGG categories and mechanics. */
function TaxonomyPills({ game }: { game: CollectionGame }) {
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
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.label}
          className={`max-w-full truncate rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${tag.mechanic ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          title={tag.label}
        >
          {tag.label}
        </span>
      ))}
      {total > tags.length && (
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[0.68rem] font-semibold">
          +{total - tags.length}
        </span>
      )}
    </div>
  );
}

/** Interactive board-game card with embedded, scrollable expansions. */
export function GameCard({
  compact = false,
  currency,
  eager = false,
  expansions = [],
  game,
  locale,
}: {
  compact?: boolean;
  currency: string;
  eager?: boolean;
  expansions?: CollectionGame[];
  game: CollectionGame;
  locale: string;
}) {
  const t = useI18n();
  if (compact) {
    return (
      <article className="hover:bg-muted/60 flex items-center gap-3 rounded-2xl p-2 transition duration-200">
        <ArtworkLink compact game={game} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold">{game.name}</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {game.yearPublished ?? t("common.yearUnknown")}
            {game.moneySpent > 0 && (
              <> · {formatMoney(game.moneySpent, currency, locale)}</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <EditGameDialog currency={currency} game={game} />
          <RemoveControl game={game} />
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-card shadow-soft overflow-hidden rounded-3xl border p-3 transition duration-300 hover:-translate-y-1">
      <div className="relative">
        <ArtworkLink eager={eager} game={game} />
        <div className="absolute top-3 right-3">
          <FavoriteControl game={game} />
        </div>
      </div>
      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display line-clamp-2 text-lg font-bold">
              {game.name}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {game.yearPublished ?? t("common.yearUnknown")}
              {game.moneySpent > 0 && (
                <> · {formatMoney(game.moneySpent, currency, locale)}</>
              )}
            </p>
          </div>
          {game.bggRating !== null && (
            <span className="bg-muted flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-bold">
              <Star className="fill-accent text-accent size-3" />
              {game.bggRating.toFixed(1)}
            </span>
          )}
        </div>
        <TaxonomyPills game={game} />
        <div className="text-muted-foreground mt-4 flex min-w-0 items-center border-t pt-3 text-xs">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Users className="size-3.5" />
              {game.minPlayers}–{game.maxPlayers}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <Clock3 className="size-3.5 shrink-0" />
              <span className="truncate">
                {formatDuration(game.maxPlaytime)}
              </span>
            </span>
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-0.5">
            <EditGameDialog currency={currency} game={game} />
            <RemoveControl game={game} />
          </div>
        </div>
        {expansions.length > 0 && (
          <section className="mt-4 border-t pt-3">
            <div className="text-muted-foreground flex items-center justify-between gap-2 px-2 pb-1 text-xs font-bold">
              <span>{t("game.expansions")}</span>
              <span className="tabular-nums">{expansions.length}</span>
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto overscroll-contain pr-1">
              {expansions.map((expansion) => (
                <GameCard
                  key={expansion.id}
                  game={expansion}
                  compact
                  currency={currency}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
