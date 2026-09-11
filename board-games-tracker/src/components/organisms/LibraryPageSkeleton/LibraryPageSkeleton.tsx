import type { ReactNode } from "react";

import { GameCardSkeleton } from "@/components/atoms/GameCardSkeleton/GameCardSkeleton";

/** Accessible label announced while a library route streams its content. */
type LibraryPageSkeletonProps = {
  label: string;
};

/**
 * Reserves the page header, filter panel, and first card rows during navigation.
 *
 * @param root0 - Properties that describe the pending library page.
 * @param root0.label - Localized loading text announced to assistive technology.
 * @returns A non-interactive skeleton matching the eventual library layout.
 */
export function LibraryPageSkeleton({
  label,
}: LibraryPageSkeletonProps): ReactNode {
  return (
    <div aria-busy="true" aria-label={label} role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="animate-pulse">
        <header className="mb-10 flex items-end justify-between gap-5">
          <div className="w-full max-w-xl space-y-3">
            <div className="bg-muted h-3 w-24 rounded" />
            <div className="bg-muted h-10 w-64 max-w-full rounded-lg" />
            <div className="bg-muted h-4 w-80 max-w-full rounded" />
          </div>
          <div className="bg-muted hidden h-11 w-32 rounded-full sm:block" />
        </header>
        <section className="bg-card mb-8 rounded-xl border p-4 shadow-sm">
          <div className="bg-muted mb-5 h-5 w-28 rounded" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="space-y-2" key={index}>
                <div className="bg-muted h-3 w-20 rounded" />
                <div className="bg-muted h-11 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
