import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import type { CollectionGame } from "@/core";
import { cn } from "@/utils/cn";

/** Wishlist size and the newest wishlist covers. */
type WishlistSpotlightProps = {
  count: number;
  games: CollectionGame[];
};

/**
 * Previews the wishlist as a small overlapping stack of its newest covers.
 *
 * @param root0 - Properties that configure the preview.
 * @param root0.count - Games saved on the wishlist in total.
 * @param root0.games - Newest wishlist games, shown front to back.
 * @returns A panel with the covers, the wishlist size, and a link to it.
 */
export function WishlistSpotlight({
  count,
  games,
}: WishlistSpotlightProps): ReactNode {
  const t = useTranslations("dashboard");

  return (
    <section className="glass-panel flex flex-col rounded-xl p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold">{t("wishlistTitle")}</h2>
      {games.length > 0 ? (
        <ul className="mt-6 flex">
          {games.map((game, index) => (
            <li
              className={cn(
                "w-24 shrink-0 sm:w-28",
                index > 0 ? "-ml-6" : null,
                index % 2 === 0 ? "-rotate-3" : "rotate-3",
              )}
              key={game.id}
              style={{ zIndex: games.length - index }}
            >
              <GameArtwork
                className="ring-card shadow-lg ring-4"
                imageUrl={game.imageUrl}
                name={game.name}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-muted-foreground mt-6">
        {t("wishlistCount", { count })}
      </p>
      <div className="mt-auto pt-6">
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
          href="/wishlist"
        >
          {t("openWishlist")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
