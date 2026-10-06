import { useFormatter, useNow, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import type { RecentLibraryGame } from "@/core";

/** Latest collection additions, newest first. */
type RecentlyAddedProps = {
  items: RecentLibraryGame[];
};

/**
 * Lists the latest additions to the collection with how long ago each arrived.
 *
 * @param root0 - Properties that configure the list.
 * @param root0.items - Recently added games with their addition time.
 * @returns A titled list of recent additions.
 */
export function RecentlyAdded({ items }: RecentlyAddedProps): ReactNode {
  const format = useFormatter();
  const now = useNow();
  const t = useTranslations();

  return (
    <section>
      <h2 className="font-display text-xl font-bold">
        {t("dashboard.recentTitle")}
      </h2>
      <ol className="mt-5 grid gap-3">
        {items.map(({ addedAt, game }) => (
          <li className="flex items-center gap-4" key={game.id}>
            <GameArtwork
              className="w-14 shrink-0"
              imageUrl={game.imageUrl}
              name={game.name}
            />
            <div className="min-w-0">
              <p className="truncate font-bold">{game.name}</p>
              <p className="text-muted-foreground flex gap-2 text-sm">
                {game.isExpansion ? (
                  <span className="text-accent font-semibold">
                    {t("common.expansion")}
                  </span>
                ) : null}
                <time dateTime={addedAt.toISOString()}>
                  {format.relativeTime(addedAt, now)}
                </time>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
