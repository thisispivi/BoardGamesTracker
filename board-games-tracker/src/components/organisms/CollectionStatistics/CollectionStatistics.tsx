"use client";

import {
  Banknote,
  BookOpen,
  Brain,
  ChartNoAxesCombined,
  CircleCheck,
  Clock3,
  Dices,
  Puzzle,
  ReceiptText,
  Scale,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { StatGrid } from "@/components/molecules/StatGrid/StatGrid";
import { StatsCharts } from "@/components/organisms/StatsCharts/StatsCharts";
import type { CollectionGame } from "@/core";
import { calculateCollectionStats } from "@/utils/collectionStats";
import { weightNumberFormat } from "@/utils/weightFormat";

/** Owned games and display currency used by the statistics page. */
type CollectionStatisticsProps = {
  collection: CollectionGame[];
  currency: string;
};

/**
 * Renders the collection totals and charts from the supplied library.
 *
 * @param root0 - Collection and display preferences.
 * @param root0.collection - Owned games, including expansions.
 * @param root0.currency - ISO currency code used for monetary statistics.
 * @returns The statistics header, totals, and interactive charts.
 */
export function CollectionStatistics({
  collection,
  currency,
}: CollectionStatisticsProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations();
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
      currency: currency,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Describes a subset of a total for a fraction tile.
   *
   * @param part - Items in the subset.
   * @param total - Items the subset is drawn from; zero yields an empty bar.
   * @returns The formatted part and total, their spoken form, and the share.
   */
  function formatFraction(part: number, total: number) {
    const formattedPart = format.number(part);
    const formattedTotal = format.number(total);
    return {
      label: t("common.fraction", {
        part: formattedPart,
        total: formattedTotal,
      }),
      part: formattedPart,
      ratio: total > 0 ? part / total : 0,
      total: formattedTotal,
    };
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
      icon: Puzzle,
      label: t("stats.expansions"),
      value: format.number(stats.expansions),
    },
    {
      icon: CircleCheck,
      label: t("stats.playedGames"),
      value: formatFraction(stats.playedBaseGames, stats.baseGames),
    },
    {
      icon: ChartNoAxesCombined,
      label: t("stats.pricedCoverage"),
      value: formatFraction(stats.pricedItems, stats.totalItems),
    },
    {
      icon: Banknote,
      label: t("stats.totalValue"),
      tone: "accent" as const,
      value: formatCurrency(stats.totalSpent),
    },
    {
      icon: Scale,
      label: t("stats.averagePrice"),
      tone: "accent" as const,
      value: formatCurrency(stats.averageSpent),
    },
    {
      icon: ReceiptText,
      label: t("stats.medianPrice"),
      tone: "accent" as const,
      value: formatCurrency(stats.medianSpent),
    },
    {
      icon: Brain,
      label: t("stats.averageWeight"),
      value:
        stats.averageWeight === null
          ? t("stats.noValue")
          : t("stats.weightValue", {
              value: format.number(stats.averageWeight, weightNumberFormat),
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
  ];

  return (
    <>
      <PageHeader
        description={t("stats.description")}
        eyebrow={t("stats.eyebrow")}
        title={t("stats.title")}
      />
      <StatGrid className="mb-5 sm:grid-cols-3 lg:grid-cols-5" stats={cards} />
      <StatsCharts
        categories={stats.categories}
        complexity={stats.complexity}
        currency={currency}
        decades={stats.decades}
        easiestGames={stats.easiestGames}
        hardestGames={stats.hardestGames}
        mechanics={stats.mechanics}
        mostExpensive={stats.mostExpensive}
        playerCounts={stats.playerCounts}
        playtime={stats.playtime}
        prices={stats.prices}
      />
    </>
  );
}
