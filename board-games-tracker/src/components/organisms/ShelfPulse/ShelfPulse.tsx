import { Heart } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { CollectionGame, HomeSummary } from "@/core";
import { weightNumberFormat } from "@/utils/weightFormat";

/** Radius of the played ring inside its 100-unit view box. */
const ringRadius = 42;

/** Circumference of the played ring, which the stroke dash is measured against. */
const ringCircumference = 2 * Math.PI * ringRadius;

/** Currency and library snapshot summarized by the bento. */
type ShelfPulseProps = {
  currency: string;
  summary: HomeSummary;
};

/**
 * Summarizes the shelf in four tiles sized by how much each figure matters.
 *
 * Played games get the large tile, the heaviest game sits over its own cover,
 * and spending and expansions share the remaining row.
 *
 * @param root0 - Properties that configure the shelf summary.
 * @param root0.currency - ISO currency code used for the money spent.
 * @param root0.summary - Library snapshot supplying every figure.
 * @returns A four-tile summary of the collection.
 */
export function ShelfPulse({ currency, summary }: ShelfPulseProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations();
  const playedRatio =
    summary.baseGames > 0 ? summary.playedBaseGames / summary.baseGames : 0;

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold">
        {t("dashboard.glanceTitle")}
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-primary text-primary-foreground flex flex-col gap-5 rounded-xl p-5 sm:col-span-2 sm:flex-row sm:items-center lg:row-span-2 lg:p-6">
          <PlayedRing
            ratio={playedRatio}
            share={format.number(playedRatio, {
              maximumFractionDigits: 0,
              style: "percent",
            })}
          />
          <p>
            <span className="font-display block text-4xl font-bold tabular-nums">
              {format.number(summary.playedBaseGames)}
            </span>
            <span className="mt-1 block text-base font-semibold opacity-85">
              {t("dashboard.playedOf", {
                total: format.number(summary.baseGames),
              })}
            </span>
            <span className="mt-1 block opacity-75">
              {t("dashboard.playedLabel")}
            </span>
          </p>
        </div>

        <HeaviestGame game={summary.heaviestGame} />

        <div className="glass-panel rounded-xl p-5">
          <p className="text-muted-foreground text-sm">
            {t("dashboard.spent")}
          </p>
          <p className="font-display mt-2 truncate text-2xl font-bold tabular-nums">
            {format.number(summary.totalSpent, {
              currency,
              maximumFractionDigits: 2,
              style: "currency",
            })}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <p className="text-muted-foreground text-sm">
            {t("dashboard.expansions")}
          </p>
          <p className="font-display mt-2 text-2xl font-bold tabular-nums">
            {format.number(summary.expansions)}
          </p>
          <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-sm">
            <Heart aria-hidden="true" className="text-accent size-4" />
            {t("dashboard.favorites", { count: summary.favorites })}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Played share drawn by the ring and its formatted percentage. */
type PlayedRingProps = {
  ratio: number;
  share: string;
};

/**
 * Draws the played share as a ring around its percentage.
 *
 * The ring is decorative because the tile beside it states the same figure.
 *
 * @param root0 - Properties that configure the ring.
 * @param root0.ratio - Played share between zero and one.
 * @param root0.share - Localized percentage printed inside the ring.
 * @returns A hidden-from-assistive-technology progress ring.
 */
function PlayedRing({ ratio, share }: PlayedRingProps): ReactNode {
  const boundedRatio = Math.min(Math.max(ratio, 0), 1);

  return (
    <div
      aria-hidden="true"
      className="relative grid size-24 shrink-0 place-items-center sm:size-28"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={ringRadius}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth="9"
        />
        {boundedRatio > 0 ? (
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={ringRadius}
            stroke="currentColor"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringCircumference * (1 - boundedRatio)}
            strokeLinecap="round"
            strokeWidth="9"
          />
        ) : null}
      </svg>
      <span className="font-display text-2xl font-bold tabular-nums">
        {share}
      </span>
    </div>
  );
}

/** Heaviest rated base game, or null when no game has a complexity rating. */
type HeaviestGameProps = {
  game: CollectionGame | null;
};

/**
 * Shows the heaviest base game over its cover, or explains why the tile is empty.
 *
 * @param root0 - Properties that configure the tile.
 * @param root0.game - Heaviest rated base game, or null.
 * @returns A wide tile naming the game and its weight.
 */
function HeaviestGame({ game }: HeaviestGameProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations();

  if (!game) {
    return (
      <div className="glass-panel flex items-end rounded-xl p-6 sm:col-span-2">
        <p className="text-muted-foreground max-w-sm text-sm">
          {t("dashboard.noWeights")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-40 items-end overflow-hidden rounded-xl bg-[#12302a] p-6 text-[#f3f6ef] sm:col-span-2">
      {game.imageUrl ? (
        <Image
          alt=""
          className="-z-20 object-cover"
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          src={game.imageUrl}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-[#0c1410]/90 via-[#0c1410]/55 to-[#0c1410]/15"
      />
      <div className="min-w-0">
        <p className="text-sm opacity-80">{t("dashboard.heaviest")}</p>
        <p className="font-display mt-1 truncate text-2xl font-bold">
          {game.name}
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums opacity-90">
          {t("stats.weightValue", {
            value: format.number(game.weight ?? 0, weightNumberFormat),
          })}
        </p>
      </div>
    </div>
  );
}
