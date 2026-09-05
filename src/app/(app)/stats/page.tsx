import {
  Banknote,
  BookOpen,
  Brain,
  ChartNoAxesCombined,
  Clock3,
  Dices,
  Heart,
  Puzzle,
  ReceiptText,
  Scale,
} from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { StatGrid } from "@/components/molecules/StatGrid/StatGrid";
import { StatsCharts } from "@/components/organisms/StatsCharts/StatsCharts";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";
import { calculateCollectionStats } from "@/utils/collectionStats";

/**
 * Statistics page metadata.
 *
 * @returns Localized metadata for the page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("stats.metaTitle") };
}

/**
 * Useful financial and taxonomy insights for the owned collection.
 *
 * @returns The rendered stats page.
 */
export default async function StatsPage(): Promise<ReactNode> {
  const session = await requireUser();
  const [collection, preferences, format, t] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getFormatter(),
    getTranslations(),
  ]);
  const stats = calculateCollectionStats(collection);

  /**
   * Formats a monetary statistic in the user's preferred currency.
   *
   * @param value - Monetary value expressed in the preferred currency.
   * @returns The localized currency string.
   */
  function formatCurrency(value: number): string {
    return format.number(value, {
      style: "currency",
      currency: preferences.currency,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Formats a share of the collection, reporting an empty shelf as zero.
   *
   * @param part - Number of items in the subset being described.
   * @returns The localized percentage.
   */
  function formatShare(part: number): string {
    return format.number(stats.totalItems ? part / stats.totalItems : 0, {
      style: "percent",
      maximumFractionDigits: 0,
    });
  }

  const cards = [
    {
      icon: BookOpen,
      label: t("stats.totalItems"),
      value: format.number(stats.totalItems),
    },
    {
      icon: Dices,
      label: t("stats.baseGames"),
      value: format.number(stats.baseGames),
    },
    {
      icon: Banknote,
      label: t("stats.totalValue"),
      value: formatCurrency(stats.totalSpent),
    },
    {
      icon: Scale,
      label: t("stats.averagePrice"),
      value: formatCurrency(stats.averageSpent),
    },
    {
      icon: ReceiptText,
      label: t("stats.medianPrice"),
      value: formatCurrency(stats.medianSpent),
    },
    {
      icon: ChartNoAxesCombined,
      label: t("stats.pricedCoverage"),
      value: `${format.number(stats.pricedItems)} / ${format.number(stats.totalItems)}`,
    },
    {
      icon: Brain,
      label: t("stats.averageWeight"),
      value:
        stats.averageWeight === null
          ? t("stats.noValue")
          : t("stats.weightValue", {
              value: format.number(stats.averageWeight, {
                maximumFractionDigits: 1,
              }),
            }),
    },
    {
      icon: Clock3,
      label: t("stats.averagePlaytime"),
      value:
        stats.averagePlaytime === null
          ? t("stats.noValue")
          : t("stats.minutes", {
              minutes: format.number(Math.round(stats.averagePlaytime)),
            }),
    },
    {
      icon: Puzzle,
      label: t("stats.expansionShare"),
      value: formatShare(stats.expansions),
    },
    {
      icon: Heart,
      label: t("stats.favoriteShare"),
      value: formatShare(stats.favorites),
    },
  ];

  return (
    <>
      <PageHeader
        description={t("stats.description")}
        eyebrow={t("stats.eyebrow")}
        title={t("stats.title")}
      />
      <StatGrid className="mb-5 lg:grid-cols-5" stats={cards} />
      <StatsCharts
        categories={stats.categories}
        complexity={stats.complexity}
        currency={preferences.currency}
        decades={stats.decades}
        mechanics={stats.mechanics}
        mostExpensive={stats.mostExpensive}
        playerCounts={stats.playerCounts}
        playtime={stats.playtime}
      />
    </>
  );
}
