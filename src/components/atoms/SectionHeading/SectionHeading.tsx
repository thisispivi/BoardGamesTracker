import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Content of a section-level heading and its trailing slot. */
type SectionHeadingProps = {
  description?: string;
  eyebrow: string;
  meta?: ReactNode;
  title: string;
  tone?: "primary" | "accent";
};

/**
 * Section-level heading matching the page header's typographic rhythm.
 *
 * Shares the eyebrow tracking and display face used by `PageHeader` so a
 * section reads one clear step below the page title.
 *
 * @param root0 - Properties that configure section heading.
 * @param root0.description - Optional supporting sentence shown under the title.
 * @param root0.eyebrow - Short context label displayed above the title.
 * @param root0.meta - Optional counts or controls aligned to the trailing edge.
 * @param root0.title - Localized heading text.
 * @param root0.tone - Colour role for the eyebrow; defaults to the primary hue.
 * @returns The rendered section heading.
 */
export function SectionHeading({
  description,
  eyebrow,
  meta,
  title,
  tone = "primary",
}: SectionHeadingProps): ReactNode {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-bold tracking-[0.18em] uppercase",
            tone === "accent" ? "text-accent" : "text-primary",
          )}
        >
          {eyebrow}
        </p>
        <h2 className="font-display mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {description === undefined ? null : (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {meta}
    </div>
  );
}
