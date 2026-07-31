import { BookOpen, Heart } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/atoms/Logo/Logo";
import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { CollectionBrowser } from "@/components/organisms/CollectionBrowser/CollectionBrowser";
import type { CollectionGame } from "@/core";
import { getSharedLibrary } from "@/server/sharing";

type SharedLibraryPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Shared-library page metadata.
 *
 * @returns The documented function result.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("sharing.metaTitle"),
    robots: { index: false, follow: false },
  };
}

type SharedSectionProps = {
  currency: string;
  games: CollectionGame[];
  icon: typeof BookOpen;
  title: string;
};

/**
 * One read-only library section with its own search and filters.
 *
 * @param root0 - Component or function properties.
 * @param root0.currency - The 'currency' property.
 * @param root0.games - The 'games' property.
 * @param root0.icon - The 'icon' property.
 * @param root0.title - The 'title' property.
 * @returns The documented function result.
 */
function SharedSection({
  currency,
  games,
  icon: Icon,
  title,
}: SharedSectionProps) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="font-display mb-5 flex items-center gap-2 text-2xl font-bold">
        <Icon className="text-primary size-5" />
        {title}
      </h2>
      <CollectionBrowser currency={currency} games={games} readOnly />
    </section>
  );
}

/**
 * Public, link-only view of a library someone chose to share.
 *
 * @param root0 - Component or function properties.
 * @param root0.params - The 'params' property.
 * @returns The documented function result.
 */
export default async function SharedLibraryPage({
  params,
}: SharedLibraryPageProps) {
  const [{ token }, t] = await Promise.all([params, getTranslations()]);
  const shared = await getSharedLibrary(token);
  if (!shared) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <PageHeader
        description={t("sharing.publicBody")}
        eyebrow={t("sharing.eyebrow")}
        title={t("sharing.ownerTitle", { name: shared.name })}
      />
      {shared.collection ? (
        <SharedSection
          currency={shared.currency}
          games={shared.collection}
          icon={BookOpen}
          title={t("navigation.collection")}
        />
      ) : null}
      {shared.wishlist ? (
        <SharedSection
          currency={shared.currency}
          games={shared.wishlist}
          icon={Heart}
          title={t("navigation.wishlist")}
        />
      ) : null}
    </div>
  );
}
