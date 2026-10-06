import { Banknote, BookOpen, Puzzle, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Logo } from "@/components/atoms/Logo/Logo";
import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { StatGrid } from "@/components/molecules/StatGrid/StatGrid";
import { CollectionBrowser } from "@/components/organisms/CollectionBrowser/CollectionBrowser";
import type { CollectionGame } from "@/core";
import { getSharedLibrary } from "@/server/sharing";
import { cn } from "@/utils/cn";

/** Properties supplied to the tokenized public-library route. */
type SharedLibraryPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Shared-library page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("sharing.metaTitle"),
    robots: { index: false, follow: false },
  };
}

/** Properties used to render one section of a shared library. */
type SharedSectionProps = {
  currency: string;
  games: CollectionGame[];
  icon: typeof BookOpen;
  sharePrices: boolean;
  title: string;
};

/** Collection totals displayed on a public sharing page. */
type SharedStatsProps = {
  currency: string;
  games: CollectionGame[];
  sharePrices: boolean;
};

/**
 * Summarizes the deliberately shared games without exposing extra personal data.
 *
 * @param root0 - Properties that configure the shared library page.
 * @param root0.currency - The owner's display currency.
 * @param root0.games - The games the owner chose to publish.
 * @param root0.sharePrices - Whether the owner chose to reveal prices.
 * @returns The rendered library summary.
 */
async function SharedStats({ currency, games, sharePrices }: SharedStatsProps) {
  const [format, t] = await Promise.all([getFormatter(), getTranslations()]);
  const cards = [
    {
      icon: BookOpen,
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
    <StatGrid
      className={cn(
        "mb-8",
        sharePrices ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2",
      )}
      stats={[
        ...cards.map((card) => ({ ...card, value: format.number(card.value) })),
        ...(sharePrices
          ? [
              {
                icon: Banknote,
                label: t("sharing.moneySpent"),
                value: format.number(spent, {
                  currency,
                  style: "currency",
                }),
              },
            ]
          : []),
      ]}
    />
  );
}

/**
 * One read-only library section with its own search and filters.
 *
 * @param root0 - Properties that configure shared section.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.games - Game records available to the component.
 * @param root0.icon - Decorative icon rendered beside the label.
 * @param root0.sharePrices - Whether prices are visible for this section.
 * @param root0.title - Localized heading displayed by the component.
 * @returns The rendered shared section.
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
      <CollectionBrowser
        currency={currency}
        source={{ games, kind: "shared" }}
      />
    </section>
  );
}

/**
 * Public, link-only view of a library someone chose to share.
 *
 * @param root0 - Properties that configure shared library page.
 * @param root0.params - Dynamic route parameters supplied by Next.js.
 * @returns The rendered shared library page.
 */
export default async function SharedLibraryPage({
  params,
}: SharedLibraryPageProps): Promise<ReactNode> {
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
          icon={ShoppingBag}
          sharePrices={shared.sharePrices}
          title={t("navigation.wishlist")}
        />
      ) : null}
    </div>
  );
}
