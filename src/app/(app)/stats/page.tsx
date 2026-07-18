import {
  Banknote,
  Boxes,
  ChartNoAxesCombined,
  Heart,
  ReceiptText,
  Scale,
} from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { StatsCharts } from "@/components/stats-charts";
import { calculateCollectionStats } from "@/lib/collection-stats";
import { formatMoney } from "@/lib/currency";
import { getDictionary, getLocale } from "@/lib/i18n";
import { translate } from "@/lib/messages";
import { getCollection } from "@/server/collection";
import { getUserPreferences } from "@/server/preferences";
import { requireUser } from "@/server/session";

/** Statistics page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return { title: translate(dictionary, "stats.metaTitle") };
}

/** Useful financial and taxonomy insights for the owned collection. */
export default async function StatsPage() {
  const session = await requireUser();
  const [collection, preferences, locale, dictionary] = await Promise.all([
    getCollection(session.user.id),
    getUserPreferences(session.user.id),
    getLocale(),
    getDictionary(),
  ]);
  const stats = calculateCollectionStats(collection);
  const cards = [
    {
      label: translate(dictionary, "stats.totalValue"),
      value: formatMoney(stats.totalSpent, preferences.currency, locale),
      icon: Banknote,
    },
    {
      label: translate(dictionary, "stats.averagePrice"),
      value: formatMoney(stats.averageSpent, preferences.currency, locale),
      icon: Scale,
    },
    {
      label: translate(dictionary, "stats.medianPrice"),
      value: formatMoney(stats.medianSpent, preferences.currency, locale),
      icon: ReceiptText,
    },
    {
      label: translate(dictionary, "stats.pricedCoverage"),
      value: `${stats.pricedItems}/${stats.totalItems}`,
      icon: ChartNoAxesCombined,
    },
    {
      label: translate(dictionary, "stats.expansionShare"),
      value: stats.totalItems
        ? `${Math.round((stats.expansions / stats.totalItems) * 100)}%`
        : "0%",
      icon: Boxes,
    },
    {
      label: translate(dictionary, "stats.favoriteShare"),
      value: stats.totalItems
        ? `${Math.round((stats.favorites / stats.totalItems) * 100)}%`
        : "0%",
      icon: Heart,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={translate(dictionary, "stats.eyebrow")}
        title={translate(dictionary, "stats.title")}
        description={translate(dictionary, "stats.description")}
      />
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <article
            key={card.label}
            className="bg-card shadow-soft min-w-0 rounded-2xl border p-5"
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
        locale={locale}
        mechanics={stats.mechanics}
        mostExpensive={stats.mostExpensive}
      />
    </>
  );
}
