import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";
import { WishlistBrowser } from "@/components/organisms/WishlistBrowser/WishlistBrowser";
import { getWishlist } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/**
 * Wishlist page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("wishlist.metaTitle") };
}

/**
 * Games the signed-in user may want to buy later.
 *
 * @returns The rendered wishlist page.
 */
export default async function WishlistPage(): Promise<ReactNode> {
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
        <WishlistBrowser
          currency={preferences.currency}
          games={wishlist}
          quickAction={
            <AddGameDialog
              compact
              currency={preferences.currency}
              destination="wishlist"
            />
          }
        />
      ) : (
        <EmptyState
          description={t("wishlist.emptyBody")}
          icon={ShoppingBag}
          title={t("wishlist.emptyTitle")}
        />
      )}
    </>
  );
}
