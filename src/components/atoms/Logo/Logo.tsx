import Image from "next/image";
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
      aria-label={compact ? "Board Games Tracker" : undefined}
      className={cn(
        "font-display inline-flex items-center gap-3 font-bold tracking-tight",
        className,
      )}
      href="/"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="size-10 shrink-0 drop-shadow-sm"
        height={64}
        src="/logo.svg"
        width={64}
      />
      {!compact ? (
        <span className="text-base whitespace-nowrap">Board Games Tracker</span>
      ) : null}
    </Link>
  );
}
