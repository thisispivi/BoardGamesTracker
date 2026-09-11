"use client";

import { RotateCcw } from "lucide-react";
import { useInView } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef } from "react";

import { Button } from "@/components/atoms/Button/Button";
import { GameCardSkeleton } from "@/components/atoms/GameCardSkeleton/GameCardSkeleton";

/** Distance below the viewport at which the next page starts loading. */
const preloadMargin = "0px 0px 600px 0px";

/** Continuation state and callbacks used by an infinite library grid. */
type LibraryInfiniteLoaderProps = {
  hasFailed: boolean;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

/**
 * Loads the next page as the end of the grid nears the viewport.
 *
 * Automatic loading pauses after a failure, so an unreachable server is not
 * requested in a loop; the visitor retries explicitly instead.
 *
 * @param root0 - Properties that configure the scroll sentinel.
 * @param root0.hasFailed - Whether the last request failed.
 * @param root0.hasMore - Whether the server reports another page.
 * @param root0.isLoading - Whether a request is already in flight.
 * @param root0.onLoadMore - Callback that requests the next page.
 * @param root0.onRetry - Callback that repeats the failed request.
 * @returns A row of pulsing card placeholders, a retry prompt, or an empty sentinel.
 */
export function LibraryInfiniteLoader({
  hasFailed,
  hasMore,
  isLoading,
  onLoadMore,
  onRetry,
}: LibraryInfiniteLoaderProps): ReactNode {
  const t = useTranslations("libraryPagination");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isNearViewport = useInView(sentinelRef, { margin: preloadMargin });

  useEffect(() => {
    if (isNearViewport && hasMore && !isLoading && !hasFailed) onLoadMore();
  }, [hasFailed, hasMore, isLoading, isNearViewport, onLoadMore]);

  return (
    <div ref={sentinelRef}>
      {hasFailed ? (
        <div
          className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center"
          role="alert"
        >
          <p className="text-muted-foreground text-sm">{t("loadError")}</p>
          <Button onClick={onRetry} type="button" variant="secondary">
            <RotateCcw aria-hidden="true" className="size-4" />
            {t("retry")}
          </Button>
        </div>
      ) : isLoading ? (
        <div aria-busy="true" className="mt-3 sm:mt-4" role="status">
          <span className="sr-only">{t("loadingMore")}</span>
          <div
            aria-hidden="true"
            className="grid animate-pulse gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3"
          >
            <GameCardSkeleton />
            <GameCardSkeleton className="hidden md:flex" />
            <GameCardSkeleton className="hidden 2xl:flex" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
