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
 * Presents headline figures as separate tiles inside one description list.
 *
 * Each figure is a term-description pair with the caption before the value, so
 * assistive technology reads them in the order the list declares. The tiles are
 * translucent, which reads as a plain card on a flat page and lets a tinted
 * backdrop show through where one exists.
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
    <dl className={cn("grid grid-cols-2 gap-3", className)}>
      {stats.map((stat) => (
        <div
          className="glass-panel flex min-w-0 items-center gap-3 rounded-xl p-4 sm:gap-4 sm:p-5"
          key={stat.label}
        >
          <span className="bg-primary/12 text-primary grid size-10 shrink-0 place-items-center rounded-lg sm:size-11">
            <stat.icon aria-hidden="true" className="size-4.5 sm:size-5" />
          </span>
          <div className="flex min-w-0 flex-col-reverse">
            <dt className="text-muted-foreground truncate text-xs sm:text-sm">
              {stat.label}
            </dt>
            <dd className="font-display truncate text-xl font-bold tabular-nums sm:text-2xl">
              {stat.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
