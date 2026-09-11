"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import type { GameTag } from "@/core";
import { cn } from "@/utils/cn";
import { countFittingTags } from "@/utils/tagFit";

/** Taxonomy label and facet rendered as a single pill. */
type TagPillProps = {
  className?: string;
  tag: GameTag;
};

/**
 * Renders one taxonomy label, tinted by the facet it belongs to.
 *
 * @param root0 - Properties that configure the pill.
 * @param root0.className - Optional classes merged with the pill styles.
 * @param root0.tag - Label and facet shown by the pill.
 * @returns A single taxonomy pill.
 */
function TagPill({ className, tag }: TagPillProps): ReactNode {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold whitespace-nowrap",
        tag.tone === "mechanic"
          ? "bg-primary/10 text-primary"
          : "bg-accent/10 text-accent",
        className,
      )}
    >
      {tag.label}
    </span>
  );
}

/**
 * Reads the natural pill widths of an off-screen row and counts what fits.
 *
 * @param row - Off-screen row holding every pill followed by the overflow chip.
 * @returns The number of leading pills that fit within the available width.
 */
function measureVisibleTags(row: HTMLElement): number {
  const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
  const widths = [...row.children].map(
    (child) => child.getBoundingClientRect().width,
  );
  const overflowWidth = widths.pop() ?? 0;

  return countFittingTags(widths, gap, row.clientWidth, overflowWidth);
}

/** Taxonomy pills and the placement of the row that holds them. */
type TagRowProps = {
  className?: string;
  tags: GameTag[];
};

/**
 * Shows taxonomy pills on exactly one line, with the remainder behind a tooltip.
 *
 * Every pill stays in the accessibility tree through the overflow tooltip, so
 * hiding pills is a layout decision rather than a loss of information.
 *
 * @param root0 - Properties that configure the row.
 * @param root0.className - Optional classes merged with the row styles.
 * @param root0.tags - Taxonomy labels available to the row, in display order.
 * @returns A single-line pill row, or null when the game has no taxonomy.
 */
export function TagRow({ className, tags }: TagRowProps): ReactNode {
  const t = useTranslations("game");
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  useEffect(() => {
    const row = measureRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() =>
      setVisibleCount(measureVisibleTags(row)),
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, [tags]);

  if (tags.length === 0) return null;

  const visible = tags.slice(0, visibleCount);
  const hidden = tags.length - visible.length;

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-x-0 top-0 flex flex-nowrap gap-1.5 overflow-hidden"
        ref={measureRef}
      >
        {tags.map((tag) => (
          <TagPill className="shrink-0" key={tag.label} tag={tag} />
        ))}
        <TagPill
          className="shrink-0"
          tag={{ label: `+${tags.length}`, tone: "category" }}
        />
      </div>
      <div className="flex min-w-0 flex-nowrap gap-1.5 overflow-hidden">
        {visible.map((tag) => (
          <TagPill className="shrink-0" key={tag.label} tag={tag} />
        ))}
        {hidden > 0 ? (
          <Tooltip
            content={
              <span className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagPill key={tag.label} tag={tag} />
                ))}
              </span>
            }
          >
            <button
              aria-label={t("moreTags", { count: hidden })}
              className="bg-muted text-muted-foreground hover:bg-accent/10 hover:text-accent shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold tabular-nums transition"
              type="button"
            >
              +{hidden}
            </button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
