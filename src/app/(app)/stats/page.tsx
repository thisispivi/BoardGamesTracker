import {
  Banknote,
  Boxes,
  ChartNoAxesCombined,
  Heart,
  ReceiptText,
  Scale,
} from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";

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
export default async function StatsPage() {
  const session = await requireUser();
  const [collection, preferences, format, t] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getFormatter(),
    getTranslations(),
  ]);
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
  const stats = calculateCollectionStats(collection);
  const cards = [
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
      icon: Boxes,
      label: t("stats.expansionShare"),
      value: stats.totalItems
        ? format.number(stats.expansions / stats.totalItems, {
            style: "percent",
            maximumFractionDigits: 0,
          })
        : format.number(0, { style: "percent" }),
    },
    {
      icon: Heart,
      label: t("stats.favoriteShare"),
      value: stats.totalItems
        ? format.number(stats.favorites / stats.totalItems, {
            style: "percent",
            maximumFractionDigits: 0,
          })
        : format.number(0, { style: "percent" }),
    },
  ];

  return (
    <>
      <PageHeader
        description={t("stats.description")}
        eyebrow={t("stats.eyebrow")}
        title={t("stats.title")}
      />
      <StatGrid className="mb-8 sm:grid-cols-3 2xl:grid-cols-6" stats={cards} />
      <StatsCharts
        categories={stats.categories}
        complexity={stats.complexity}
        currency={preferences.currency}
        mechanics={stats.mechanics}
        mostExpensive={stats.mostExpensive}
      />
    </>
  );
}
