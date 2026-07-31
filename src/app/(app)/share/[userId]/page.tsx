import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { CollectionBrowser } from "@/components/organisms/CollectionBrowser/CollectionBrowser";
import { requireUser } from "@/server/session";
import { getSharedCollection } from "@/server/sharing";

type SharedCollectionPageProps = {
  params: Promise<{ userId: string }>;
};

/**
 * Shared-collection page metadata.
 *
 * @param root0 - Component or function properties.
 * @param root0.params - The 'params' property.
 * @returns The documented function result.
 */
export async function generateMetadata({
  params,
}: SharedCollectionPageProps): Promise<Metadata> {
  const [{ userId }, t] = await Promise.all([params, getTranslations()]);
  const shared = await getSharedCollection(userId);
  return {
    title: shared
      ? t("sharing.ownerTitle", { name: shared.name })
      : t("sharing.metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Read-only view of another member's shared collection.
 *
 * @param root0 - Component or function properties.
 * @param root0.params - The 'params' property.
 * @returns The documented function result.
 */
export default async function SharedCollectionPage({
  params,
}: SharedCollectionPageProps) {
  await requireUser();
  const [{ userId }, t] = await Promise.all([params, getTranslations()]);
  const shared = await getSharedCollection(userId);
  if (!shared) {
    notFound();
  }

  return (
    <>
      <PageHeader
        action={
          <Link
            className="hover:bg-muted flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition"
            href="/share"
          >
            <ArrowLeft className="size-4" />
            {t("sharing.backToDirectory")}
          </Link>
        }
        description={t("collection.count", { count: shared.games.length })}
        eyebrow={t("sharing.eyebrow")}
        title={t("sharing.ownerTitle", { name: shared.name })}
      />
      <CollectionBrowser
        currency={shared.currency}
        games={shared.games}
        readOnly
      />
    </>
  );
}
