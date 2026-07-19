"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
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

import type { CountDatum } from "@/core";
import { getTaxonomyLabel } from "@/lib/game-taxonomy";

const chartColors = ["var(--primary)", "var(--accent)", "#3f8fba", "#b86b8f"];

type StatsChartsProps = {
  categories: CountDatum[];
  complexity: { key: "light" | "medium" | "heavy" | "expert"; value: number }[];
  currency: string;
  mechanics: CountDatum[];
  mostExpensive: CountDatum[];
};

type TooltipEntry = {
  color?: string;
  fill?: string;
  payload?: { name?: string };
  value?: number | string;
};

/** Responsive, accessible visual summaries for collection statistics. */
export function StatsCharts({
  categories,
  complexity,
  currency,
  mechanics,
  mostExpensive,
}: StatsChartsProps) {
  const format = useFormatter();
  const locale = useLocale();
  const t = useTranslations();
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  const complexityData = complexity.map((datum) => ({
    name: t(`stats.complexity.${datum.key}`),
    value: datum.value,
  }));
  const categoryData = categories.map((datum) => ({
    ...datum,
    name: getTaxonomyLabel(datum.name, "category", locale),
  }));
  const mechanicData = mechanics.map((datum) => ({
    ...datum,
    name: getTaxonomyLabel(datum.name, "mechanic", locale),
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title={t("stats.expensiveChart")}>
        {mostExpensive.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={mostExpensive}
              layout="vertical"
              margin={{ left: 8, right: 12 }}
            >
              <defs>
                <linearGradient id="purchase-bars" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
              <ChartGrid />
              <XAxis
                axisLine={false}
                tick={axisTick}
                tickFormatter={formatCurrency}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="name"
                tick={axisTick}
                tickFormatter={(value: string) => truncate(value, 23)}
                tickLine={false}
                type="category"
                width={140}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(value) => formatCurrency(Number(value))}
                  />
                }
                cursor={tooltipCursor}
                isAnimationActive={false}
              />
              <Bar
                dataKey="value"
                fill="url(#purchase-bars)"
                maxBarSize={28}
                radius={[0, 9, 9, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title={t("stats.complexityChart")}>
        {complexityData.some((datum) => datum.value > 0) ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cornerRadius={9}
                    data={complexityData}
                    dataKey="value"
                    innerRadius="48%"
                    minAngle={3}
                    nameKey="name"
                    outerRadius="76%"
                    paddingAngle={4}
                    stroke="var(--card)"
                    strokeWidth={3}
                  >
                    {complexityData.map((datum, index) => (
                      <Cell
                        fill={
                          chartColors[index % chartColors.length] ??
                          "var(--primary)"
                        }
                        key={datum.name}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltip />}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex shrink-0 flex-wrap justify-center gap-x-5 gap-y-2 px-2 pt-2 pb-1">
              {complexityData.map((datum, index) => (
                <li
                  className="text-muted-foreground flex items-center gap-2 text-xs"
                  key={datum.name}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{
                      background:
                        chartColors[index % chartColors.length] ??
                        "var(--primary)",
                    }}
                  />
                  {datum.name}
                  <strong className="text-foreground tabular-nums">
                    {datum.value}
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <RankingCard
        data={categoryData}
        gradientId="category-bars"
        title={t("stats.categoriesChart")}
      />
      <RankingCard
        data={mechanicData}
        gradientId="mechanic-bars"
        title={t("stats.mechanicsChart")}
      />
    </div>
  );
}

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };
const tooltipCursor = { fill: "var(--muted)", opacity: 0.5 };

/** Consistent chart frame with a softly tinted plotting area. */
function ChartCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="bg-card shadow-soft overflow-hidden rounded-3xl border p-5 sm:p-7">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="bg-muted/25 mt-5 h-88 min-w-0 rounded-2xl p-3 sm:p-4">
        {children}
      </div>
    </section>
  );
}

/** Ranked horizontal bars suited to long taxonomy labels. */
function RankingCard({
  title,
  data,
  gradientId,
}: {
  title: string;
  data: CountDatum[];
  gradientId: string;
}) {
  return (
    <ChartCard title={title}>
      {data.length ? (
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 12 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop
                  offset="100%"
                  stopColor="color-mix(in srgb, var(--primary) 60%, var(--accent))"
                />
              </linearGradient>
            </defs>
            <ChartGrid />
            <XAxis
              allowDecimals={false}
              axisLine={false}
              tick={axisTick}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="name"
              tick={axisTick}
              tickFormatter={(value: string) => truncate(value, 24)}
              tickLine={false}
              type="category"
              width={144}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={tooltipCursor}
              isAnimationActive={false}
            />
            <Bar
              dataKey="value"
              fill={`url(#${gradientId})`}
              maxBarSize={25}
              radius={[0, 9, 9, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </ChartCard>
  );
}

/** Theme-aware tooltip shared by bars and the donut chart. */
function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter = String,
}: {
  active?: boolean;
  label?: number | string;
  payload?: readonly TooltipEntry[];
  valueFormatter?: (value: number | string) => string;
}) {
  const entry = payload?.[0];
  if (!active || entry?.value === undefined) return null;
  const name = entry.payload?.name ?? label;

  return (
    <div className="bg-card/95 min-w-36 rounded-xl border p-3 shadow-2xl backdrop-blur-md">
      {name !== undefined ? (
        <p className="text-muted-foreground max-w-56 text-xs leading-4">
          {name}
        </p>
      ) : null}
      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ background: entry.color ?? entry.fill ?? "var(--primary)" }}
        />
        <p className="font-display text-base font-bold tabular-nums">
          {valueFormatter(entry.value)}
        </p>
      </div>
    </div>
  );
}

/** Quiet grid lines that respect both application themes. */
function ChartGrid() {
  return (
    <CartesianGrid
      horizontal={false}
      opacity={0.75}
      stroke="var(--border)"
      strokeDasharray="4 5"
    />
  );
}

/** Ellipsizes an axis label while the tooltip retains the complete title. */
function truncate(value: string, maximum: number): string {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}

/** Localized empty state for chart panels without enough source data. */
function EmptyChart() {
  const t = useTranslations();
  return (
    <div className="text-muted-foreground grid h-full place-items-center text-sm">
      {t("stats.noData")}
    </div>
  );
}
