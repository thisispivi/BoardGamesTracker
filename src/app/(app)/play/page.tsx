import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { GamePicker } from "@/components/organisms/GamePicker/GamePicker";
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
        description={t("play.description")}
        eyebrow={t("play.eyebrow")}
        title={t("play.title")}
      />
      <GamePicker games={collection} />
    </>
  );
}
