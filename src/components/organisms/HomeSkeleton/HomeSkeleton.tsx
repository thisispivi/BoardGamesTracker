import type { ReactNode } from "react";

/** Accessible label announced while the home page streams. */
type HomeSkeletonProps = {
  label: string;
};

/**
 * Reserves the hero and shelf summary while the home page loads.
 *
 * @param root0 - Properties that describe the pending page.
 * @param root0.label - Localized loading text announced to assistive technology.
 * @returns A non-interactive placeholder shaped like the home page.
 */
export function HomeSkeleton({ label }: HomeSkeletonProps): ReactNode {
  return (
    <div aria-busy="true" aria-label={label} role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="bg-card grid gap-10 rounded-xl border px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <div className="bg-muted h-12 w-4/5 rounded-lg" />
            <div className="bg-muted h-12 w-3/5 rounded-lg" />
            <div className="bg-muted h-5 w-2/3 rounded" />
            <div className="flex gap-3 pt-4">
              <div className="bg-muted h-13 w-52 rounded-full" />
              <div className="bg-muted h-13 w-40 rounded-full" />
            </div>
          </div>
          <div className="bg-muted mx-auto hidden aspect-square w-48 rounded-lg lg:block" />
        </div>
        <div className="bg-muted mt-14 h-7 w-56 rounded" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-muted h-44 rounded-xl sm:col-span-2 lg:row-span-2 lg:h-auto" />
          <div className="bg-muted h-40 rounded-xl sm:col-span-2" />
          <div className="bg-muted h-32 rounded-xl" />
          <div className="bg-muted h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
