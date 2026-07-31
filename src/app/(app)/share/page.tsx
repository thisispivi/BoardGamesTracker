import { Library, Share2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { requireUser } from "@/server/session";
import { listSharedCollections } from "@/server/sharing";

/**
 * Shared-collections index metadata.
 *
 * @returns The documented function result.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("sharing.metaTitle") };
}

/**
 * Directory of collections other members have chosen to share.
 *
 * @returns The documented function result.
 */
export default async function SharedCollectionsPage() {
  const session = await requireUser();
  const [collections, t] = await Promise.all([
    listSharedCollections(),
    getTranslations(),
  ]);
  const others = collections.filter(
    (collection) => collection.userId !== session.user.id,
  );

  return (
    <>
      <PageHeader
        description={t("sharing.directoryBody")}
        eyebrow={t("sharing.eyebrow")}
        title={t("sharing.directoryTitle")}
      />
      {others.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-16 text-center">
          <Share2 className="text-primary mx-auto size-9" />
          <h2 className="font-display mt-5 text-2xl font-bold">
            {t("sharing.emptyTitle")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            {t("sharing.emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {others.map((collection) => (
            <li key={collection.userId}>
              <Link
                className="bg-card shadow-soft hover:border-primary/40 flex items-center gap-4 rounded-3xl border p-5 transition hover:-translate-y-0.5"
                href={`/share/${collection.userId}`}
              >
                <span className="from-primary to-primary/70 text-primary-foreground font-display grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br font-black">
                  {collection.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">
                    {collection.name}
                  </span>
                  <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                    <Library className="size-3.5" />
                    {t("collection.gameCount", { count: collection.games })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
