"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/utils/cn";

/** Results of one page, its position, and the loader for its neighbours. */
type PagedListProps = {
  children: ReactNode;
  listClassName?: string;
  loadingLabel: string;
  navigationLabel: string;
  onPageChange: (page: number) => void;
  page: number;
  pageLabel: string;
  pages: number;
  pending: boolean;
};

/**
 * Scrollable result region with a loading overlay and previous/next controls.
 *
 * The current results stay visible, dimmed, while the next page loads, and both
 * controls are disabled until it arrives.
 *
 * @param root0 - Page state and the rendered results.
 * @param root0.children - Rows of the current page.
 * @param root0.listClassName - Extra classes for the scrolling list.
 * @param root0.loadingLabel - Text announced and shown while a page loads.
 * @param root0.navigationLabel - Accessible name of the pagination landmark.
 * @param root0.onPageChange - Requests a one-based page number.
 * @param root0.page - One-based number of the current page.
 * @param root0.pageLabel - Localized position such as "Page 2 of 5".
 * @param root0.pages - Total number of pages, at least one.
 * @param root0.pending - Whether a page request is in flight.
 * @returns The results with their pagination controls.
 */
export function PagedList({
  children,
  listClassName,
  loadingLabel,
  navigationLabel,
  onPageChange,
  page,
  pageLabel,
  pages,
  pending,
}: PagedListProps): ReactNode {
  const t = useTranslations();

  return (
    <>
      <div aria-busy={pending} className="relative min-h-32">
        <div
          className={cn(
            "max-h-128 space-y-1 overflow-y-auto overscroll-contain pr-1 transition-opacity",
            pending ? "opacity-35" : "opacity-100",
            listClassName,
          )}
        >
          {children}
        </div>
        {pending ? (
          <div className="bg-card/72 absolute inset-0 grid place-items-center rounded-lg backdrop-blur-[2px]">
            <div className="text-primary flex flex-col items-center gap-3 text-sm font-bold">
              <AppSpinner className="size-7" label={loadingLabel} />
              <span>{loadingLabel}</span>
            </div>
          </div>
        ) : null}
      </div>
      <nav
        aria-label={navigationLabel}
        className="mt-5 flex items-center justify-between gap-4 border-t pt-5"
      >
        <Button
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ChevronLeft className="size-4" /> {t("admin.previous")}
        </Button>
        <p className="text-muted-foreground text-xs font-bold tabular-nums">
          {pageLabel}
        </p>
        <Button
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || page >= pages}
          onClick={() => onPageChange(page + 1)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {t("admin.next")} <ChevronRight className="size-4" />
        </Button>
      </nav>
    </>
  );
}
