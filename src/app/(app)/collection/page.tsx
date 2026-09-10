import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";
import { CollectionBrowser } from "@/components/organisms/CollectionBrowser/CollectionBrowser";
import { getLibraryFacetGames, getLibraryPage } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";
import { createFirstPageQuery } from "@/utils/libraryPages";

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
  const [facetGames, initialPage, preferences, t] = await Promise.all([
    getLibraryFacetGames(session.user.id, "collection"),
    getLibraryPage(session.user.id, {
      ...createFirstPageQuery(),
      location: "collection",
    }),
    getUserPreferences(session.user.id),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        action={<AddGameDialog currency={preferences.currency} />}
        description={t("collection.count", { count: facetGames.length })}
        eyebrow={t("collection.eyebrow")}
        title={t("collection.title")}
      />
      <CollectionBrowser
        currency={preferences.currency}
        quickAction={<AddGameDialog currency={preferences.currency} />}
        source={{ facetGames, initialPage, kind: "private" }}
      />
    </>
  );
}
