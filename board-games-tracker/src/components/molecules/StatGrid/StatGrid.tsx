import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** A formatted part of a whole, its spoken form, and its share for the progress bar. */
type StatFraction = {
  label: string;
  part: string;
  ratio: number;
  total: string;
};

/** A single headline figure with its icon, localized caption, and group tint. */
type Stat = {
  icon: LucideIcon;
  label: string;
  tone?: "accent" | "primary";
  value: number | string | StatFraction;
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
 * assistive technology reads them in the order the list declares. A fraction is
 * read as its spoken label, while sighted readers get the part emphasized over
 * a muted total and a bar showing the share. The tiles are translucent, which
 * reads as a plain card on a flat page and lets a tinted backdrop show through.
 * The tint separates one family of figures from another at a glance, so a
 * caller ordering figures by subject can colour each run accordingly.
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
          className="glass-panel hover:border-primary/35 flex min-w-0 items-center gap-3 rounded-xl p-4 transition-colors sm:gap-4 sm:p-5"
          key={stat.label}
        >
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg ring-1 sm:size-11",
              stat.tone === "accent"
                ? "bg-accent/12 text-accent ring-accent/20"
                : "bg-primary/12 text-primary ring-primary/20",
            )}
          >
            <stat.icon aria-hidden="true" className="size-4.5 sm:size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col-reverse">
            <dt className="text-muted-foreground truncate text-[0.6875rem] font-semibold tracking-wide uppercase sm:text-xs">
              {stat.label}
            </dt>
            <dd className="font-display min-w-0 text-xl font-bold tabular-nums sm:text-2xl">
              {typeof stat.value === "object" ? (
                <>
                  <span className="sr-only">{stat.value.label}</span>
                  <span
                    aria-hidden="true"
                    className="flex items-baseline gap-1 whitespace-nowrap"
                  >
                    {stat.value.part}
                    <span className="text-muted-foreground text-sm font-semibold sm:text-base">
                      / {stat.value.total}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "my-1.5 block h-1.5 overflow-hidden rounded-full",
                      stat.tone === "accent" ? "bg-accent/12" : "bg-primary/12",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        stat.tone === "accent" ? "bg-accent" : "bg-primary",
                      )}
                      style={{
                        width: `${Math.round(Math.min(Math.max(stat.value.ratio, 0), 1) * 100)}%`,
                      }}
                    />
                  </span>
                </>
              ) : (
                <span className="block truncate">{stat.value}</span>
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
