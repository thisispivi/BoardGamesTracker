import Link from "next/link";

import { cn } from "@/lib/utils";

/** Board Games Tracker wordmark and compact geometric mark. */
export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
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
