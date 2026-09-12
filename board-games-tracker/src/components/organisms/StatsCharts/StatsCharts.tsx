"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { AxisDomainItem, PieSectorShapeProps } from "recharts";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
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
import { fittingCornerRadius } from "@/utils/fittingCornerRadius";
import { getTaxonomyLabel } from "@/utils/gameTaxonomy";

/**
 * Saturated series colors, deliberately independent of the interface palette.
 *
 * Every chart paints its marks in a single entry, so bar length rather than a
 * shifting hue carries the comparison. The values are picked to stay legible on
 * both the light and the dark translucent panels.
 */
const chartColors = {
  amber: "#e8871e",
  emerald: "#12a594",
  indigo: "#6366f1",
  rose: "#e0457b",
  sky: "#0e9ad6",
} as const;

/** Slice colors of the complexity ring, in ascending complexity order. */
const complexityColors = [
  chartColors.emerald,
  chartColors.sky,
  chartColors.indigo,
  chartColors.rose,
];

/** Shared value-axis label styling for every Cartesian chart. */
const axisTick = { fill: "var(--foreground)", fillOpacity: 0.72, fontSize: 12 };

/** Left edge, in pixels, where a ranking label starts inside its gutter. */
const rankingLabelInset = 2;

/** Horizontal space, in pixels, reserved for the labels of a ranking chart. */
const rankingLabelWidth = 188;

/** Character budget of a ranking label before it is ellipsized. */
const rankingLabelBudget = 28;

/** Hover highlight drawn behind the active bar. */
const tooltipCursor = { fill: "var(--muted)", opacity: 0.5 };

/** Value axis starting at zero and ending just past the largest value. */
const zeroBasedDomain: readonly [AxisDomainItem, AxisDomainItem] = [0, "auto"];

/** Value axis spanning BoardGameGeek's complete weight scale. */
const weightDomain: readonly [AxisDomainItem, AxisDomainItem] = [0, 5];

/** Aggregated collection statistics rendered across the chart dashboard. */
type StatsChartsProps = {
  categories: CountDatum[];
  complexity: ComplexityDatum[];
  currency: string;
  decades: DecadeDatum[];
  easiestGames: CountDatum[];
  hardestGames: CountDatum[];
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
 * @param root0.easiestGames - Lightest rated base games, lightest first.
 * @param root0.hardestGames - Heaviest rated base games, heaviest first.
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
  easiestGames,
  hardestGames,
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
   * Formats a chart count as a plain localized number for an axis tick.
   *
   * @param value - Count reported by the axis.
   * @returns The localized number.
   */
  function formatCount(value: number): string {
    return format.number(value);
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

  /**
   * Formats a BGG complexity value on its one-to-five scale.
   *
   * @param value - Numeric complexity reported by the chart.
   * @returns A localized weight label.
   */
  function formatWeight(value: number | string): string {
    return t("stats.weightValue", {
      value: format.number(Number(value), { maximumFractionDigits: 2 }),
    });
  }

  const complexityData = complexity.map((datum, index) => ({
    fill: complexityColor(index),
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
      <ChartCard compact title={t("stats.expensiveChart")}>
        <RankingChart
          color={chartColors.amber}
          data={mostExpensive}
          tickFormatter={formatCurrency}
          valueFormatter={(value) => formatCurrency(Number(value))}
        />
      </ChartCard>

      <ChartCard compact title={t("stats.complexityChart")}>
        {complexityData.some((datum) => datum.value > 0) ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cornerRadius={10}
                    data={complexityData}
                    dataKey="value"
                    innerRadius="52%"
                    minAngle={6}
                    nameKey="name"
                    outerRadius="82%"
                    paddingAngle={5}
                    shape={ComplexitySlice}
                    stroke="none"
                  />
                  <Tooltip
                    content={<ChartTooltip valueFormatter={formatGameCount} />}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex shrink-0 flex-wrap justify-center gap-x-5 gap-y-2 px-2 pt-2 pb-1">
              {complexityData.map((datum) => (
                <li
                  className="text-foreground/75 flex items-center gap-2 text-xs"
                  key={datum.name}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: datum.fill }}
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

      <ChartCard
        compact
        hint={t("stats.easiestHint")}
        title={t("stats.easiestChart")}
      >
        <RankingChart
          color={chartColors.emerald}
          data={easiestGames}
          domain={weightDomain}
          tickFormatter={formatCount}
          valueFormatter={formatWeight}
        />
      </ChartCard>

      <ChartCard
        compact
        hint={t("stats.hardestHint")}
        title={t("stats.hardestChart")}
      >
        <RankingChart
          color={chartColors.rose}
          data={hardestGames}
          domain={weightDomain}
          tickFormatter={formatCount}
          valueFormatter={formatWeight}
        />
      </ChartCard>

      <ChartCard compact title={t("stats.categoriesChart")}>
        <RankingChart
          color={chartColors.indigo}
          data={categoryData}
          tickFormatter={formatCount}
          valueFormatter={formatGameCount}
        />
      </ChartCard>

      <ChartCard compact title={t("stats.mechanicsChart")}>
        <RankingChart
          color={chartColors.rose}
          data={mechanicData}
          tickFormatter={formatCount}
          valueFormatter={formatGameCount}
        />
      </ChartCard>

      <ChartCard hint={t("stats.playersHint")} title={t("stats.playersChart")}>
        {playerData.some((datum) => datum.value > 0) ? (
          <ColumnChart
            color={chartColors.emerald}
            data={playerData}
            valueFormatter={formatGameCount}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title={t("stats.playtimeChart")}>
        {playtimeData.some((datum) => datum.value > 0) ? (
          <ColumnChart
            color={chartColors.sky}
            data={playtimeData}
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
                    stopColor={chartColors.indigo}
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartColors.indigo}
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
                dot={{ fill: chartColors.indigo, r: 3, strokeWidth: 0 }}
                fill="url(#decade-area)"
                stroke={chartColors.indigo}
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
  compact?: boolean;
  hint?: string;
  title: string;
};

/**
 * Translucent chart frame with a softly tinted plotting area.
 *
 * @param root0 - Properties that configure chart card.
 * @param root0.children - Content rendered inside the component.
 * @param root0.className - Optional classes merged with the component styles, typically a column span.
 * @param root0.compact - Whether the plotting area uses the shorter height suited to a handful of ranked rows.
 * @param root0.hint - Localized caption explaining how the chart counts its data.
 * @param root0.title - Localized heading displayed by the component.
 * @returns A titled card containing the supplied chart.
 */
function ChartCard({
  children,
  className,
  compact = false,
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
          "bg-muted/25 min-w-0 rounded-lg p-3 sm:p-4",
          compact ? "h-72" : "h-88",
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
  color: string;
  data: CountDatum[];
  domain?: readonly [AxisDomainItem, AxisDomainItem];
  tickFormatter: (value: number) => string;
  valueFormatter: (value: number | string) => string;
};

/**
 * Ranked horizontal bars suited to long taxonomy labels and game names.
 *
 * Labels start at the left edge of the plotting area rather than hugging the
 * bars, so the whole gutter is available to a long name instead of being padded
 * away whenever a short one sits above it. Every row is labelled: left to its
 * own spacing rule the axis drops every other name once the rows are close
 * together, which leaves half the ranking unreadable.
 *
 * @param root0 - Properties that configure ranking chart.
 * @param root0.color - Fill painted on every bar of the chart.
 * @param root0.data - Labeled values drawn in their given order.
 * @param root0.domain - Value-axis bounds, from zero to just past the largest value unless a fixed scale applies.
 * @param root0.tickFormatter - Function that formats a value-axis tick.
 * @param root0.valueFormatter - Function that formats a value for the tooltip.
 * @returns A horizontal ranking chart, or its localized empty state.
 */
function RankingChart({
  color,
  data,
  domain = zeroBasedDomain,
  tickFormatter,
  valueFormatter,
}: RankingChartProps): ReactNode {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
        <ChartGrid />
        <XAxis
          allowDecimals={false}
          axisLine={false}
          domain={domain}
          tick={axisTick}
          tickFormatter={tickFormatter}
          tickLine={false}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="name"
          interval={0}
          tick={<RankingTick />}
          tickLine={false}
          type="category"
          width={rankingLabelWidth}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={valueFormatter} />}
          cursor={tooltipCursor}
          isAnimationActive={false}
        />
        <Bar
          dataKey="value"
          fill={color}
          maxBarSize={22}
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Placement and text supplied by Recharts for one ranking axis tick. */
type RankingTickProps = {
  payload?: { value?: string };
  y?: number;
};

/**
 * Ranking axis label rendered flush with the left edge of the plotting area.
 *
 * @param root0 - Properties that configure ranking tick.
 * @param root0.payload - Axis entry carrying the label of the row.
 * @param root0.y - Vertical center of the row, in pixels.
 * @returns The label of one ranked row.
 */
function RankingTick({ payload, y }: RankingTickProps): ReactNode {
  return (
    <text
      dominantBaseline="central"
      fill="var(--foreground)"
      fontSize={13}
      x={rankingLabelInset}
      y={y}
    >
      {truncate(payload?.value ?? "", rankingLabelBudget)}
    </text>
  );
}

/** Short-labelled data rendered as vertical columns. */
type ColumnChartProps = {
  color: string;
  data: CountDatum[];
  valueFormatter: (value: number | string) => string;
};

/**
 * Vertical columns suited to short ordered labels such as table sizes.
 *
 * @param root0 - Properties that configure column chart.
 * @param root0.color - Fill painted on every column of the chart.
 * @param root0.data - Labeled counts drawn in their natural order.
 * @param root0.valueFormatter - Function that formats a value for the tooltip.
 * @returns A vertical column chart.
 */
function ColumnChart({
  color,
  data,
  valueFormatter,
}: ColumnChartProps): ReactNode {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
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
          fill={color}
          maxBarSize={46}
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
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
        <p className="text-foreground/80 max-w-56 text-xs leading-4">{name}</p>
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
 * Complexity ring slice that keeps its rounded corners at any slice width.
 *
 * Recharts hangs pointer handling on the layer wrapping the shape and reads the
 * item attributes off the drawn path for touch, so both are forwarded while the
 * remaining sector props are re-derived here.
 *
 * @param root0 - Sector geometry and presentation supplied by Recharts.
 * @param root0."data-recharts-item-id" - Identifier of the owning graphical item.
 * @param root0."data-recharts-item-index" - Position of the slice in the data.
 * @param root0.cornerRadius - Rounding requested by the chart, in pixels.
 * @param root0.cx - Horizontal center of the ring, in pixels.
 * @param root0.cy - Vertical center of the ring, in pixels.
 * @param root0.endAngle - Trailing edge of the slice, in degrees.
 * @param root0.fill - Color painted inside the slice.
 * @param root0.innerRadius - Inner edge of the ring, in pixels.
 * @param root0.outerRadius - Outer edge of the ring, in pixels.
 * @param root0.startAngle - Leading edge of the slice, in degrees.
 * @returns One rounded sector of the complexity ring.
 */
function ComplexitySlice({
  "data-recharts-item-id": itemId,
  "data-recharts-item-index": itemIndex,
  cornerRadius,
  cx,
  cy,
  endAngle,
  fill,
  innerRadius,
  outerRadius,
  startAngle,
}: PieSectorShapeProps): ReactNode {
  return (
    <Sector
      cornerRadius={fittingCornerRadius({
        cornerRadius: cornerRadius ?? 0,
        endAngle,
        innerRadius,
        outerRadius,
        startAngle,
      })}
      cx={cx}
      cy={cy}
      data-recharts-item-id={itemId}
      data-recharts-item-index={itemIndex}
      endAngle={endAngle}
      fill={fill}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      stroke="none"
    />
  );
}

/**
 * Picks a complexity slice color, cycling once the palette is exhausted.
 *
 * @param index - Position of the band within the ring.
 * @returns A CSS color usable as a fill.
 */
function complexityColor(index: number): string {
  return (
    complexityColors[index % complexityColors.length] ?? chartColors.emerald
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
