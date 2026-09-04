"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
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

import type { ComplexityDatum, CountDatum } from "@/core";
import { getTaxonomyLabel } from "@/utils/gameTaxonomy";

const chartColors = ["var(--primary)", "var(--accent)", "#3f8fba", "#b86b8f"];

/** Aggregated collection statistics rendered across the chart dashboard. */
type StatsChartsProps = {
  categories: CountDatum[];
  complexity: ComplexityDatum[];
  currency: string;
  mechanics: CountDatum[];
  mostExpensive: CountDatum[];
};

/** Recharts tooltip datum normalized for the shared tooltip renderer. */
type TooltipEntry = {
  color?: string;
  fill?: string;
  payload?: { name?: string };
  value?: number | string;
};

/**
 * Responsive, accessible visual summaries for collection statistics.
 *
 * @param root0 - Properties that configure stats charts.
 * @param root0.categories - BoardGameGeek categories associated with the games.
 * @param root0.complexity - Complexity distribution rendered by the charts.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.mechanics - BoardGameGeek mechanics associated with the games.
 * @param root0.mostExpensive - Highest-cost games included in the ranking.
 * @returns The rendered stats charts.
 */
export function StatsCharts({
  categories,
  complexity,
  currency,
  mechanics,
  mostExpensive,
}: StatsChartsProps): ReactNode {
  const format = useFormatter();
  const locale = useLocale();
  const t = useTranslations();
  /**
   * Formats a chart value in the user's preferred currency.
   *
   * @param value - Monetary chart value expressed in the preferred currency.
   * @returns The localized currency string.
   */
  function formatCurrency(value: number): string {
    return format.number(value, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  }
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

/** Heading and visualization rendered inside a statistics card. */
type ChartCardProps = {
  children: React.ReactNode;
  title: string;
};

/**
 * Consistent chart frame with a softly tinted plotting area.
 *
 * @param root0 - Properties that configure chart card.
 * @param root0.children - Content rendered inside the component.
 * @param root0.title - Localized heading displayed by the component.
 * @returns A titled card containing the supplied chart.
 */
function ChartCard({ children, title }: ChartCardProps): ReactNode {
  return (
    <section className="bg-card shadow-soft overflow-hidden rounded-xl border p-5 sm:p-7">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="bg-muted/25 mt-5 h-88 min-w-0 rounded-lg p-3 sm:p-4">
        {children}
      </div>
    </section>
  );
}

/** Ranked data and chart settings rendered by a horizontal bar card. */
type RankingCardProps = {
  title: string;
  data: CountDatum[];
  gradientId: string;
};

/**
 * Ranked horizontal bars suited to long taxonomy labels.
 *
 * @param root0 - Properties that configure ranking card.
 * @param root0.title - Localized heading displayed by the component.
 * @param root0.data - Untrusted bytes received from the remote image host.
 * @param root0.gradientId - Stable SVG identifier used by the chart gradient.
 * @returns A horizontal ranking chart, or its localized empty state.
 */
function RankingCard({ title, data, gradientId }: RankingCardProps): ReactNode {
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

/** Active Recharts payload and optional value formatter for a tooltip. */
type ChartTooltipProps = {
  active?: boolean;
  label?: number | string;
  payload?: readonly TooltipEntry[];
  valueFormatter?: (value: number | string) => string;
};

/**
 * Theme-aware tooltip shared by bars and the donut chart.
 *
 * @param root0 - Properties that configure chart tooltip.
 * @param root0.active - Whether the tooltip is currently visible.
 * @param root0.label - Localized label displayed by the control.
 * @param root0.payload - Chart entries supplied for the active data point.
 * @param root0.valueFormatter - Function that formats a numeric tooltip value.
 * @returns A formatted tooltip for the active chart datum, or null when inactive.
 */
function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter = String,
}: ChartTooltipProps): ReactNode {
  const entry = payload?.[0];
  if (!active || entry?.value === undefined) return null;
  const name = entry.payload?.name ?? label;

  return (
    <div className="bg-card/95 min-w-36 rounded-lg border p-3 shadow-2xl backdrop-blur-md">
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

/**
 * Quiet grid lines that respect both application themes.
 *
 * @returns Theme-aware Cartesian grid lines.
 */
function ChartGrid(): ReactNode {
  return (
    <CartesianGrid
      horizontal={false}
      opacity={0.75}
      stroke="var(--border)"
      strokeDasharray="4 5"
    />
  );
}

/**
 * Ellipsizes an axis label while the tooltip retains the complete title.
 *
 * @param value - The full category or mechanic name.
 * @param maximum - Character budget for the rendered label, including the ellipsis.
 * @returns The original text or a shortened ellipsis-terminated label.
 */
function truncate(value: string, maximum: number): string {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}

/**
 * Localized empty state for chart panels without enough source data.
 *
 * @returns A localized empty state for charts without source data.
 */
function EmptyChart(): ReactNode {
  const t = useTranslations();
  return (
    <div className="text-muted-foreground grid h-full place-items-center text-sm">
      {t("stats.noData")}
    </div>
  );
}
