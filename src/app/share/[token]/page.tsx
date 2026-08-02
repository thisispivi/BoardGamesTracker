import { Banknote, BookOpen, Boxes, Heart, Puzzle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

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
  sharePrices: boolean;
  title: string;
};

type SharedStatsProps = {
  currency: string;
  games: CollectionGame[];
  sharePrices: boolean;
};

/**
 * Summarizes the deliberately shared games without exposing extra personal data.
 *
 * @param root0 - Component properties.
 * @param root0.currency - The owner's display currency.
 * @param root0.games - The games the owner chose to publish.
 * @param root0.sharePrices - Whether the owner chose to reveal prices.
 * @returns The rendered library summary.
 */
async function SharedStats({ currency, games, sharePrices }: SharedStatsProps) {
  const [format, t] = await Promise.all([getFormatter(), getTranslations()]);
  const cards = [
    {
      icon: Boxes,
      label: t("sharing.games"),
      value: games.filter((game) => !game.isExpansion).length,
    },
    {
      icon: Puzzle,
      label: t("sharing.expansions"),
      value: games.filter((game) => game.isExpansion).length,
    },
  ];
  const spent = games.reduce((total, game) => total + game.moneySpent, 0);

  return (
    <section
      className={`mb-8 grid gap-4 ${sharePrices ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
    >
      {cards.map(({ icon: Icon, label, value }) => (
        <article
          className="bg-card shadow-soft rounded-3xl border p-5"
          key={label}
        >
          <Icon className="text-primary size-5" />
          <p className="font-display mt-5 text-3xl font-bold tabular-nums">
            {format.number(value)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm font-semibold">
            {label}
          </p>
        </article>
      ))}
      {sharePrices ? (
        <article className="bg-card shadow-soft rounded-3xl border p-5">
          <Banknote className="text-primary size-5" />
          <p className="font-display mt-5 text-3xl font-bold tabular-nums">
            {format.number(spent, { currency, style: "currency" })}
          </p>
          <p className="text-muted-foreground mt-1 text-sm font-semibold">
            {t("sharing.moneySpent")}
          </p>
        </article>
      ) : null}
    </section>
  );
}

/**
 * One read-only library section with its own search and filters.
 *
 * @param root0 - Component or function properties.
 * @param root0.currency - The 'currency' property.
 * @param root0.games - The 'games' property.
 * @param root0.icon - The 'icon' property.
 * @param root0.sharePrices - Whether prices are visible for this section.
 * @param root0.title - The 'title' property.
 * @returns The documented function result.
 */
function SharedSection({
  currency,
  games,
  icon: Icon,
  sharePrices,
  title,
}: SharedSectionProps) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="font-display mb-5 flex items-center gap-2 text-2xl font-bold">
        <Icon className="text-primary size-5" />
        {title}
      </h2>
      <SharedStats
        currency={currency}
        games={games}
        sharePrices={sharePrices}
      />
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
          sharePrices={shared.sharePrices}
          title={t("navigation.collection")}
        />
      ) : null}
      {shared.wishlist ? (
        <SharedSection
          currency={shared.currency}
          games={shared.wishlist}
          icon={Heart}
          sharePrices={shared.sharePrices}
          title={t("navigation.wishlist")}
        />
      ) : null}
    </div>
  );
}
