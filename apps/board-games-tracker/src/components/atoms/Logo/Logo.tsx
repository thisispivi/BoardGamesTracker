import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Properties that configure the product logo presentation. */
type LogoProps = {
  assetBasePath?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Board Games Tracker wordmark and compact geometric mark.
 *
 * @param root0 - Properties that configure logo.
 * @param root0.assetBasePath - Static deployment prefix for the logo asset.
 * @param root0.compact - Whether to use the condensed presentation.
 * @param root0.className - Optional classes merged with the component styles.
 * @returns The rendered logo.
 */
export function Logo({
  assetBasePath = "",
  compact = false,
  className,
}: LogoProps): ReactNode {
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
        src={`${assetBasePath}/logo.svg`}
        width={64}
      />
      {!compact ? (
        <span className="text-base whitespace-nowrap">Board Games Tracker</span>
      ) : null}
    </Link>
  );
}
