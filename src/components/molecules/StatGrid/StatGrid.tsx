import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** A single headline figure with its icon and localized caption. */
type Stat = {
  icon: LucideIcon;
  label: string;
  value: number | string;
};

/** Layout and content of a summary figure group. */
type StatGridProps = {
  className?: string;
  stats: Stat[];
};

/**
 * Presents headline figures together on a single surface.
 *
 * Each figure is a term-description pair with the caption before the value, so
 * assistive technology reads them in the order the list declares.
 *
 * @param root0 - Properties that configure stat grid.
 * @param root0.className - Optional classes merged with the component styles, typically the responsive column count.
 * @param root0.stats - Figures rendered in source order.
 * @returns The rendered stat grid, or null when there is nothing to show.
 */
export function StatGrid({ className, stats }: StatGridProps): ReactNode {
  if (stats.length === 0) {
    return null;
  }

  return (
    <dl
      className={cn(
        "bg-card shadow-soft grid grid-cols-2 rounded-xl border",
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          className="flex min-w-0 flex-col-reverse gap-1 p-5 sm:p-6"
          key={stat.label}
        >
          <dt className="text-muted-foreground truncate text-xs sm:text-sm">
            {stat.label}
          </dt>
          <dd className="font-display truncate text-2xl font-bold tabular-nums sm:text-3xl">
            {stat.value}
          </dd>
          <stat.icon aria-hidden="true" className="text-primary mb-3 size-4" />
        </div>
      ))}
    </dl>
  );
}
