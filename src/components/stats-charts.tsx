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
import type { CountDatum } from "@/lib/collection-stats";
import { formatMoney } from "@/lib/currency";
import { getTaxonomyLabel } from "@/lib/game-taxonomy";

const chartColors = ["var(--primary)", "var(--accent)", "#3f8fba", "#b86b8f"];

type StatsChartsProps = {
  categories: CountDatum[];
  complexity: { key: "light" | "medium" | "heavy" | "expert"; value: number }[];
  currency: string;
  locale: string;
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
  locale,
  mechanics,
  mostExpensive,
}: StatsChartsProps) {
  const t = useI18n();
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mostExpensive}
              layout="vertical"
              margin={{ left: 8, right: 12 }}
            >
              <defs>
                <linearGradient id="purchase-bars" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
              <ChartGrid />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={axisTick}
                tickFormatter={(value: number) =>
                  formatMoney(value, currency, locale)
                }
              />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                axisLine={false}
                tickLine={false}
                tick={axisTick}
                tickFormatter={(value: string) => truncate(value, 23)}
              />
              <Tooltip
                cursor={tooltipCursor}
                isAnimationActive={false}
                content={
                  <ChartTooltip
                    valueFormatter={(value) =>
                      formatMoney(Number(value), currency, locale)
                    }
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="url(#purchase-bars)"
                radius={[0, 9, 9, 0]}
                maxBarSize={28}
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complexityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="48%"
                    outerRadius="76%"
                    paddingAngle={4}
                    minAngle={3}
                    cornerRadius={9}
                    stroke="var(--card)"
                    strokeWidth={3}
                  >
                    {complexityData.map((datum, index) => (
                      <Cell
                        key={datum.name}
                        fill={
                          chartColors[index % chartColors.length] ??
                          "var(--primary)"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    isAnimationActive={false}
                    content={<ChartTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex shrink-0 flex-wrap justify-center gap-x-5 gap-y-2 px-2 pt-2 pb-1">
              {complexityData.map((datum, index) => (
                <li
                  key={datum.name}
                  className="text-muted-foreground flex items-center gap-2 text-xs"
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
        title={t("stats.categoriesChart")}
        data={categoryData}
        gradientId="category-bars"
      />
      <RankingCard
        title={t("stats.mechanicsChart")}
        data={mechanicData}
        gradientId="mechanic-bars"
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 12 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop
                  offset="100%"
                  stopColor="color-mix(in srgb, var(--primary) 60%, var(--accent))"
                />
              </linearGradient>
            </defs>
            <ChartGrid />
            <XAxis
              type="number"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={axisTick}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={144}
              axisLine={false}
              tickLine={false}
              tick={axisTick}
              tickFormatter={(value: string) => truncate(value, 24)}
            />
            <Tooltip
              cursor={tooltipCursor}
              isAnimationActive={false}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="value"
              fill={`url(#${gradientId})`}
              radius={[0, 9, 9, 0]}
              maxBarSize={25}
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
      {name !== undefined && (
        <p className="text-muted-foreground max-w-56 text-xs leading-4">
          {name}
        </p>
      )}
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
      stroke="var(--border)"
      strokeDasharray="4 5"
      horizontal={false}
      opacity={0.75}
    />
  );
}

/** Ellipsizes an axis label while the tooltip retains the complete title. */
function truncate(value: string, maximum: number): string {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
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
