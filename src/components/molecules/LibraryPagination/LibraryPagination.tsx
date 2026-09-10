"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/components/atoms/Button/Button";

/** Rendered and available entry counts for progressive library disclosure. */
type LibraryPaginationProps = {
  onLoadMore: () => void;
  shown: number;
  total: number;
};

/**
 * Reports visible results and reveals the next client-side batch on request.
 *
 * @param root0 - Properties that configure progressive result disclosure.
 * @param root0.onLoadMore - Callback that expands the visible result limit.
 * @param root0.shown - Number of top-level entries currently rendered.
 * @param root0.total - Number of matching top-level entries available.
 * @returns A localized result count and an optional load-more control.
 */
export function LibraryPagination({
  onLoadMore,
  shown,
  total,
}: LibraryPaginationProps): ReactNode {
  const t = useTranslations("libraryPagination");

  return (
    <div className="mt-8 flex flex-col items-center gap-3 border-t pt-6">
      <p
        aria-live="polite"
        className="text-muted-foreground text-sm tabular-nums"
      >
        {t("showing", { shown, total })}
      </p>
      {shown < total ? (
        <Button onClick={onLoadMore} type="button" variant="secondary">
          <ChevronDown aria-hidden="true" className="size-4" />
          {t("loadMore")}
        </Button>
      ) : null}
    </div>
  );
}
