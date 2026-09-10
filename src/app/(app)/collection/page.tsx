import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";
import { CollectionBrowser } from "@/components/organisms/CollectionBrowser/CollectionBrowser";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/**
 * Collection page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("collection.metaTitle") };
}

/**
 * Visual, searchable personal board-game collection.
 *
 * @returns The rendered collection page.
 */
export default async function CollectionPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [collection, preferences, t] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        action={<AddGameDialog currency={preferences.currency} />}
        description={t("collection.count", { count: collection.length })}
        eyebrow={t("collection.eyebrow")}
        title={t("collection.title")}
      />
      <CollectionBrowser
        currency={preferences.currency}
        games={collection}
        quickAction={<AddGameDialog compact currency={preferences.currency} />}
      />
    </>
  );
}
