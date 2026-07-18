import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { AddGameDialog } from "@/components/add-game-dialog";
import { PageHeader } from "@/components/page-header";
import { WishlistCard } from "@/components/wishlist-card";
import { getTranslations } from "next-intl/server";
import { getWishlist } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/** Wishlist page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("wishlist.metaTitle") };
}

/** Games the signed-in user may want to buy later. */
export default async function WishlistPage() {
  const session = await requireUser();
  const [wishlist, preferences, t] = await Promise.all([
    getWishlist(session.user.id),
    getUserPreferences(session.user.id),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={t("wishlist.eyebrow")}
        title={t("wishlist.title")}
        description={t("wishlist.count", { count: wishlist.length })}
        action={
          <AddGameDialog
            currency={preferences.currency}
            destination="wishlist"
          />
        }
      />
      {wishlist.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {wishlist.map((game) => (
            <WishlistCard
              key={game.id}
              game={game}
              currency={preferences.currency}
            />
          ))}
        </div>
      ) : (
        <section className="bg-card rounded-3xl border border-dashed p-12 text-center">
          <Heart className="text-primary mx-auto size-9" />
          <h2 className="font-display mt-4 text-2xl font-bold">
            {t("wishlist.emptyTitle")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
            {t("wishlist.emptyBody")}
          </p>
        </section>
      )}
    </>
  );
}
