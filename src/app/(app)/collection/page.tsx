import type { Metadata } from "next";

import { AddGameDialog } from "@/components/add-game-dialog";
import { CollectionBrowser } from "@/components/collection-browser";
import { PageHeader } from "@/components/page-header";
import { getDictionary, getLocale } from "@/lib/i18n";
import { translate } from "@/lib/messages";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/** Collection page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return { title: translate(dictionary, "collection.metaTitle") };
}

/** Visual, searchable personal board-game collection. */
export default async function CollectionPage() {
  const session = await requireUser();
  const [collection, preferences, locale, dictionary] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getLocale(),
    getDictionary(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={translate(dictionary, "collection.eyebrow")}
        title={translate(dictionary, "collection.title")}
        description={translate(
          dictionary,
          collection.length === 1
            ? "collection.countOne"
            : "collection.countMany",
          { count: collection.length },
        )}
        action={<AddGameDialog currency={preferences.currency} />}
      />
      <CollectionBrowser
        games={collection}
        currency={preferences.currency}
        locale={locale}
      />
    </>
  );
}
