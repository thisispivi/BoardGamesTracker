import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { GameFacts } from "@/components/molecules/GameFacts/GameFacts";
import type { CollectionGame } from "@/core";

/** Unplayed base games offered on the home page, newest first. */
type UnplayedRailProps = {
  games: CollectionGame[];
};

/**
 * Lines up the base games still waiting for a first play in a horizontal rail.
 *
 * The rail scrolls with snap points and is keyboard focusable, so arrow keys
 * reach covers beyond the viewport. With nothing left unplayed it says so.
 *
 * @param root0 - Properties that configure the rail.
 * @param root0.games - Unplayed base games in display order.
 * @returns A titled, horizontally scrolling list of covers.
 */
export function UnplayedRail({ games }: UnplayedRailProps): ReactNode {
  const t = useTranslations("dashboard");

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold" id="home-unplayed-title">
        {t("unplayedTitle")}
      </h2>
      {games.length > 0 ? (
        <div
          aria-labelledby="home-unplayed-title"
          className="-mx-5 mt-5 scroll-px-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:-mx-12 lg:scroll-px-12 lg:px-12"
          role="region"
          tabIndex={0}
        >
          <ul className="flex snap-x snap-mandatory gap-4">
            {games.map((game) => (
              <li className="w-36 shrink-0 snap-start sm:w-44" key={game.id}>
                <GameArtwork imageUrl={game.imageUrl} name={game.name} />
                <h3 className="mt-3 line-clamp-2 text-sm leading-snug font-bold">
                  {game.name}
                </h3>
                <GameFacts className="mt-2" game={game} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted-foreground mt-5 rounded-xl border border-dashed p-6">
          {t("allPlayed")}
        </p>
      )}
    </section>
  );
}
