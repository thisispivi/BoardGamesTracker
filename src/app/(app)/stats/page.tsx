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
import { StatsCharts } from "@/components/organisms/StatsCharts/StatsCharts";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";
import { calculateCollectionStats } from "@/utils/collectionStats";

/** Statistics page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("stats.metaTitle") };
}

/** Useful financial and taxonomy insights for the owned collection. */
export default async function StatsPage() {
  const session = await requireUser();
  const [collection, preferences, format, t] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getFormatter(),
    getTranslations(),
  ]);
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: preferences.currency,
      maximumFractionDigits: 2,
    });
  const stats = calculateCollectionStats(collection);
  const cards = [
    {
      label: t("stats.totalValue"),
      value: formatCurrency(stats.totalSpent),
      icon: Banknote,
    },
    {
      label: t("stats.averagePrice"),
      value: formatCurrency(stats.averageSpent),
      icon: Scale,
    },
    {
      label: t("stats.medianPrice"),
      value: formatCurrency(stats.medianSpent),
      icon: ReceiptText,
    },
    {
      label: t("stats.pricedCoverage"),
      value: `${format.number(stats.pricedItems)} / ${format.number(stats.totalItems)}`,
      icon: ChartNoAxesCombined,
    },
    {
      label: t("stats.expansionShare"),
      value: stats.totalItems
        ? format.number(stats.expansions / stats.totalItems, {
            style: "percent",
            maximumFractionDigits: 0,
          })
        : format.number(0, { style: "percent" }),
      icon: Boxes,
    },
    {
      label: t("stats.favoriteShare"),
      value: stats.totalItems
        ? format.number(stats.favorites / stats.totalItems, {
            style: "percent",
            maximumFractionDigits: 0,
          })
        : format.number(0, { style: "percent" }),
      icon: Heart,
    },
  ];

  return (
    <>
      <PageHeader
        description={t("stats.description")}
        eyebrow={t("stats.eyebrow")}
        title={t("stats.title")}
      />
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <article
            className="bg-card shadow-soft min-w-0 rounded-2xl border p-5"
            key={card.label}
          >
            <card.icon className="text-primary size-5" />
            <p className="font-display mt-5 truncate text-2xl font-bold">
              {card.value}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{card.label}</p>
          </article>
        ))}
      </section>
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
