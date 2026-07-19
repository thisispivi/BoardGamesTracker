import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AddGameDialog } from "@/components/add-game-dialog";
import { CollectionBrowser } from "@/components/collection-browser";
import { PageHeader } from "@/components/page-header";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/** Collection page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("collection.metaTitle") };
}

/** Visual, searchable personal board-game collection. */
export default async function CollectionPage() {
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
      <CollectionBrowser currency={preferences.currency} games={collection} />
    </>
  );
}
