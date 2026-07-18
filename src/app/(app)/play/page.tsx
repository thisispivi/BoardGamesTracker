import type { Metadata } from "next";

import { GamePicker } from "@/components/game-picker";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import { getCollection } from "@/server/collection";
import { requireUser } from "@/server/session";

/** Game picker page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("play.metaTitle") };
}

/** Filtered, animated game-night randomizer. */
export default async function PlayPage() {
  const session = await requireUser();
  const [collection, t] = await Promise.all([
    getCollection(session.user.id),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={t("play.eyebrow")}
        title={t("play.title")}
        description={t("play.description")}
      />
      <GamePicker games={collection} />
    </>
  );
}
