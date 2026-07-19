import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

/**
 * Board Games Tracker wordmark and compact geometric mark.
 *
 * @param root0 - Component or function properties.
 * @param root0.compact - The 'compact' property.
 * @param root0.className - The 'className' property.
 * @returns The documented function result.
 */
export function Logo({ compact = false, className }: LogoProps): ReactNode {
  return (
    <Link
      className={cn(
        "font-display inline-flex items-center gap-3 font-bold tracking-tight",
        className,
      )}
      href="/"
    >
      <span className="bg-primary text-primary-foreground relative grid size-10 rotate-3 place-items-center rounded-[14px] shadow-sm">
        <span className="absolute top-2 size-2.5 rounded-full bg-current" />
        <span className="mt-2 text-lg leading-none">T</span>
      </span>
      {!compact ? (
        <span className="text-base whitespace-nowrap">Board Games Tracker</span>
      ) : null}
    </Link>
  );
}
