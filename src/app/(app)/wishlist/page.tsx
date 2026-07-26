import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";
import { WishlistBrowser } from "@/components/organisms/WishlistBrowser/WishlistBrowser";
import { getWishlist } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/**
 * Wishlist page metadata.
 *
 * @returns The documented function result.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("wishlist.metaTitle") };
}

/**
 * Games the signed-in user may want to buy later.
 *
 * @returns The documented function result.
 */
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
        action={
          <AddGameDialog
            currency={preferences.currency}
            destination="wishlist"
          />
        }
        description={t("wishlist.count", { count: wishlist.length })}
        eyebrow={t("wishlist.eyebrow")}
        title={t("wishlist.title")}
      />
      {wishlist.length > 0 ? (
        <WishlistBrowser currency={preferences.currency} games={wishlist} />
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
