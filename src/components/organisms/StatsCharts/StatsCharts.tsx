"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  ComplexityDatum,
  CountDatum,
  DecadeDatum,
  PlayerCountDatum,
  PlaytimeDatum,
} from "@/core";
import { cn } from "@/utils/cn";
import { getTaxonomyLabel } from "@/utils/gameTaxonomy";

/** Series colors reused by every categorical chart, in assignment order. */
const chartColors = ["var(--primary)", "var(--accent)", "#3f8fba", "#b86b8f"];

/** Smallest number of axes that makes a radar readable rather than degenerate. */
const minimumRadarAxes = 3;

/** Shared axis label styling for every Cartesian chart. */
const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };

/** Hover highlight drawn behind the active bar. */
const tooltipCursor = { fill: "var(--muted)", opacity: 0.5 };

/** Aggregated collection statistics rendered across the chart dashboard. */
type StatsChartsProps = {
  categories: CountDatum[];
  complexity: ComplexityDatum[];
  currency: string;
  decades: DecadeDatum[];
  mechanics: CountDatum[];
  mostExpensive: CountDatum[];
  playerCounts: PlayerCountDatum[];
  playtime: PlaytimeDatum[];
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
 * @param root0.decades - Publication counts per decade, in chronological order.
 * @param root0.mechanics - BoardGameGeek mechanics associated with the games.
 * @param root0.mostExpensive - Highest-cost games included in the ranking.
 * @param root0.playerCounts - Base games playable at each exact table size.
 * @param root0.playtime - Base games grouped by declared session length.
 * @returns The rendered stats charts.
 */
export function StatsCharts({
  categories,
  complexity,
  currency,
  decades,
  mechanics,
  mostExpensive,
  playerCounts,
  playtime,
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

  /**
   * Describes a chart count as a pluralized number of games.
   *
   * @param value - Count reported by the hovered chart datum.
   * @returns The localized game count.
   */
  function formatGameCount(value: number | string): string {
    return t("stats.gamesCount", { count: Number(value) });
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
  const playerData = playerCounts.map((datum, index) => ({
    name:
      index === playerCounts.length - 1
        ? t("stats.playersOpen", { count: datum.players })
        : String(datum.players),
    value: datum.value,
  }));
  const playtimeData = playtime.map((datum) => ({
    name: t(`stats.playtime.${datum.key}`),
    value: datum.value,
  }));
  const decadeData = decades.map((datum) => ({
    name: t("stats.decade", { decade: String(datum.decade) }),
    value: datum.value,
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
                <BarGradient id="purchase-bars" />
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
                      <Cell fill={seriesColor(index)} key={datum.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltip valueFormatter={formatGameCount} />}
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
                    style={{ background: seriesColor(index) }}
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

      <ChartCard title={t("stats.categoriesChart")}>
        {categoryData.length >= minimumRadarAxes ? (
          <ResponsiveContainer height="100%" width="100%">
            <RadarChart data={categoryData} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="name"
                tick={axisTick}
                tickFormatter={(value: string) => truncate(value, 16)}
              />
              <PolarRadiusAxis
                allowDecimals={false}
                axisLine={false}
                tick={axisTick}
                tickCount={4}
              />
              <Radar
                dataKey="value"
                fill="var(--primary)"
                fillOpacity={0.32}
                stroke="var(--primary)"
                strokeWidth={2}
              />
              <Tooltip
                content={<ChartTooltip valueFormatter={formatGameCount} />}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <RankingChart
            data={categoryData}
            gradientId="category-bars"
            valueFormatter={formatGameCount}
          />
        )}
      </ChartCard>

      <ChartCard title={t("stats.mechanicsChart")}>
        <RankingChart
          data={mechanicData}
          gradientId="mechanic-bars"
          valueFormatter={formatGameCount}
        />
      </ChartCard>

      <ChartCard hint={t("stats.playersHint")} title={t("stats.playersChart")}>
        {playerData.some((datum) => datum.value > 0) ? (
          <ColumnChart
            data={playerData}
            gradientId="player-bars"
            valueFormatter={formatGameCount}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title={t("stats.playtimeChart")}>
        {playtimeData.some((datum) => datum.value > 0) ? (
          <ColumnChart
            data={playtimeData}
            gradientId="playtime-bars"
            valueFormatter={formatGameCount}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard className="xl:col-span-2" title={t("stats.decadesChart")}>
        {decadeData.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={decadeData}
              margin={{ left: 0, right: 12, top: 8 }}
            >
              <defs>
                <linearGradient id="decade-area" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <ChartGrid horizontal />
              <XAxis
                axisLine={false}
                dataKey="name"
                tick={axisTick}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={axisTick}
                tickLine={false}
                width={32}
              />
              <Tooltip
                content={<ChartTooltip valueFormatter={formatGameCount} />}
                cursor={{ stroke: "var(--border)" }}
                isAnimationActive={false}
              />
              <Area
                activeDot={{ r: 5, strokeWidth: 0 }}
                dataKey="value"
                dot={{ fill: "var(--primary)", r: 3, strokeWidth: 0 }}
                fill="url(#decade-area)"
                stroke="var(--primary)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>
    </div>
  );
}

/** Heading, optional caption, and visualization rendered inside a card. */
type ChartCardProps = {
  children: ReactNode;
  className?: string;
  hint?: string;
  title: string;
};

/**
 * Translucent chart frame with a softly tinted plotting area.
 *
 * @param root0 - Properties that configure chart card.
 * @param root0.children - Content rendered inside the component.
 * @param root0.className - Optional classes merged with the component styles, typically a column span.
 * @param root0.hint - Localized caption explaining how the chart counts its data.
 * @param root0.title - Localized heading displayed by the component.
 * @returns A titled card containing the supplied chart.
 */
function ChartCard({
  children,
  className,
  hint,
  title,
}: ChartCardProps): ReactNode {
  return (
    <section
      className={cn(
        "glass-panel min-w-0 overflow-hidden rounded-xl p-5 sm:p-7",
        className,
      )}
    >
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {hint ? (
        <p className="text-muted-foreground mt-1 text-xs leading-5">{hint}</p>
      ) : null}
      <div
        className={cn(
          "bg-muted/25 h-88 min-w-0 rounded-lg p-3 sm:p-4",
          hint ? "mt-3" : "mt-5",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Ranked data and chart settings rendered by a horizontal bar chart. */
type RankingChartProps = {
  data: CountDatum[];
  gradientId: string;
  valueFormatter: (value: number | string) => string;
};

/**
 * Ranked horizontal bars suited to long taxonomy labels.
 *
 * @param root0 - Properties that configure ranking chart.
 * @param root0.data - Labeled counts drawn in descending order.
 * @param root0.gradientId - Stable SVG identifier used by the chart gradient.
 * @param root0.valueFormatter - Function that formats a value for the tooltip.
 * @returns A horizontal ranking chart, or its localized empty state.
 */
function RankingChart({
  data,
  gradientId,
  valueFormatter,
}: RankingChartProps): ReactNode {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <defs>
          <BarGradient id={gradientId} />
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
          content={<ChartTooltip valueFormatter={valueFormatter} />}
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
  );
}

/** Short-labelled data rendered as vertical columns. */
type ColumnChartProps = {
  data: CountDatum[];
  gradientId: string;
  valueFormatter: (value: number | string) => string;
};

/**
 * Vertical columns suited to short ordered labels such as table sizes.
 *
 * @param root0 - Properties that configure column chart.
 * @param root0.data - Labeled counts drawn in their natural order.
 * @param root0.gradientId - Stable SVG identifier used by the chart gradient.
 * @param root0.valueFormatter - Function that formats a value for the tooltip.
 * @returns A vertical column chart.
 */
function ColumnChart({
  data,
  gradientId,
  valueFormatter,
}: ColumnChartProps): ReactNode {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop
              offset="100%"
              stopColor="color-mix(in srgb, var(--primary) 55%, var(--accent))"
            />
          </linearGradient>
        </defs>
        <ChartGrid horizontal />
        <XAxis
          axisLine={false}
          dataKey="name"
          interval={0}
          tick={axisTick}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tick={axisTick}
          tickLine={false}
          width={32}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={valueFormatter} />}
          cursor={tooltipCursor}
          isAnimationActive={false}
        />
        <Bar
          dataKey="value"
          fill={`url(#${gradientId})`}
          maxBarSize={46}
          radius={[9, 9, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Stable identifier for a horizontal bar gradient definition. */
type BarGradientProps = {
  id: string;
};

/**
 * Left-to-right brand gradient shared by the horizontal bar charts.
 *
 * @param root0 - Properties that configure bar gradient.
 * @param root0.id - Stable SVG identifier referenced by a bar fill.
 * @returns The gradient definition.
 */
function BarGradient({ id }: BarGradientProps): ReactNode {
  return (
    <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stopColor="var(--primary)" />
      <stop
        offset="100%"
        stopColor="color-mix(in srgb, var(--primary) 55%, var(--accent))"
      />
    </linearGradient>
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
 * Theme-aware tooltip shared by every chart on the page.
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

/** Which axis a Cartesian grid draws lines along. */
type ChartGridProps = {
  horizontal?: boolean;
};

/**
 * Quiet grid lines that respect both application themes.
 *
 * @param root0 - Properties that configure chart grid.
 * @param root0.horizontal - Whether lines run across the value axis of a column chart instead of a bar chart.
 * @returns Theme-aware Cartesian grid lines.
 */
function ChartGrid({ horizontal = false }: ChartGridProps): ReactNode {
  return (
    <CartesianGrid
      horizontal={horizontal}
      opacity={0.75}
      stroke="var(--border)"
      strokeDasharray="4 5"
      vertical={!horizontal}
    />
  );
}

/**
 * Picks a series color, cycling once the palette is exhausted.
 *
 * @param index - Position of the series within the chart.
 * @returns A CSS color usable as a fill.
 */
function seriesColor(index: number): string {
  return chartColors[index % chartColors.length] ?? "var(--primary)";
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
