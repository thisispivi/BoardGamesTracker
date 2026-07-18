import type { Metadata } from "next";

import { GamePicker } from "@/components/game-picker";
import { PageHeader } from "@/components/page-header";
import { getDictionary, getLocale } from "@/lib/i18n";
import { translate } from "@/lib/messages";
import { getCollection } from "@/server/collection";
import { requireUser } from "@/server/session";

/** Game picker page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return { title: translate(dictionary, "play.metaTitle") };
}

/** Filtered, animated game-night randomizer. */
export default async function PlayPage() {
  const session = await requireUser();
  const [collection, dictionary, locale] = await Promise.all([
    getCollection(session.user.id),
    getDictionary(),
    getLocale(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={translate(dictionary, "play.eyebrow")}
        title={translate(dictionary, "play.title")}
        description={translate(dictionary, "play.description")}
      />
      <GamePicker games={collection} locale={locale} />
    </>
  );
}
