import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { CollectionStatistics } from "@/components/organisms/CollectionStatistics/CollectionStatistics";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/**
 * Supplies the localized statistics page title.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("stats.metaTitle") };
}

/**
 * Loads the authenticated account's financial and taxonomy insights.
 *
 * @returns The statistics for the signed-in user's owned collection.
 */
export default async function StatsPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [collection, preferences] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
  ]);
  return (
    <CollectionStatistics
      collection={collection}
      currency={preferences.currency}
    />
  );
}
