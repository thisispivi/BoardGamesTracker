import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Optional placement classes for one placeholder card. */
type GameCardSkeletonProps = {
  className?: string;
};

/**
 * Outlines a library card while its data loads.
 *
 * The placeholder is decorative; the surrounding region announces progress
 * and supplies the pulse animation.
 *
 * @param root0 - Properties that place the placeholder.
 * @param root0.className - Classes merged with the card outline, typically responsive visibility.
 * @returns A card-shaped placeholder.
 */
export function GameCardSkeleton({
  className,
}: GameCardSkeletonProps): ReactNode {
  return (
    <div
      className={cn(
        "bg-card flex h-40 gap-4 rounded-xl border p-4 shadow-sm",
        className,
      )}
    >
      <div className="bg-muted h-full w-24 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-3">
        <div className="bg-muted h-5 w-4/5 rounded" />
        <div className="bg-muted h-3 w-1/3 rounded" />
        <div className="bg-muted mt-6 h-3 w-full rounded" />
        <div className="bg-muted h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}
