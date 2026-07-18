"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/components/i18n-provider";
import { formatMoney } from "@/lib/currency";
import type { CountDatum } from "@/lib/collection-stats";

const chartColors = ["#6d5dfc", "#ffb703", "#2a9d8f", "#e76f51"];

type StatsChartsProps = {
  categories: CountDatum[];
  complexity: { key: "light" | "medium" | "heavy" | "expert"; value: number }[];
  currency: string;
  locale: string;
  mechanics: CountDatum[];
  mostExpensive: CountDatum[];
};

/** Responsive, accessible visual summaries for collection statistics. */
export function StatsCharts({
  categories,
  complexity,
  currency,
  locale,
  mechanics,
  mostExpensive,
}: StatsChartsProps) {
  const t = useI18n();
  const complexityData = complexity.map((datum) => ({
    name: t(`stats.complexity.${datum.key}`),
    value: datum.value,
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title={t("stats.expensiveChart")}>
        {mostExpensive.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mostExpensive}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                opacity={0.2}
              />
              <XAxis
                type="number"
                tickFormatter={(value: number) =>
                  formatMoney(value, currency, locale)
                }
                fontSize={11}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={108}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) =>
                  value.length > 17 ? `${value.slice(0, 16)}…` : value
                }
              />
              <Tooltip
                formatter={(value) =>
                  formatMoney(Number(value), currency, locale)
                }
              />
              <Bar
                dataKey="value"
                fill="var(--primary)"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
      <ChartCard title={t("stats.complexityChart")}>
        {complexityData.some((datum) => datum.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={complexityData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={100}
                paddingAngle={3}
              >
                {complexityData.map((datum, index) => (
                  <Cell
                    key={datum.name}
                    fill={chartColors[index % chartColors.length] ?? "#6d5dfc"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
      <RankingCard title={t("stats.categoriesChart")} data={categories} />
      <RankingCard title={t("stats.mechanicsChart")} data={mechanics} />
    </div>
  );
}

/** Consistent chart frame with a fixed responsive plotting area. */
function ChartCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="bg-card shadow-soft rounded-3xl border p-5 sm:p-7">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-5 h-80 min-w-0">{children}</div>
    </section>
  );
}

/** Ranked horizontal bars suited to long taxonomy labels. */
function RankingCard({ title, data }: { title: string; data: CountDatum[] }) {
  return (
    <ChartCard title={title}>
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              opacity={0.2}
            />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis
              dataKey="name"
              type="category"
              width={118}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) =>
                value.length > 19 ? `${value.slice(0, 18)}…` : value
              }
            />
            <Tooltip />
            <Bar dataKey="value" fill="var(--primary)" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </ChartCard>
  );
}

/** Localized empty state for chart panels without enough source data. */
function EmptyChart() {
  const t = useI18n();
  return (
    <div className="text-muted-foreground grid h-full place-items-center text-sm">
      {t("stats.noData")}
    </div>
  );
}
