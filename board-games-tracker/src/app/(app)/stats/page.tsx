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
import { weightNumberFormat } from "@/utils/weightFormat";

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
        currency={preferences.currency}
        decades={stats.decades}
        easiestGames={stats.easiestGames}
        hardestGames={stats.hardestGames}
        mechanics={stats.mechanics}
        mostExpensive={stats.mostExpensive}
        playerCounts={stats.playerCounts}
        playtime={stats.playtime}
      />
    </>
  );
}
