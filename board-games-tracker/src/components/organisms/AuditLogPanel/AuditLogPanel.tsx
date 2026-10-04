"use client";

import { useFormatter, useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import { PagedList } from "@/components/molecules/PagedList/PagedList";
import type { AuditLogPage } from "@/core";
import { getAuditLogPageAction } from "@/server/actions/admin";

/** Initial paginated audit records displayed by the administration panel. */
type AuditLogPanelProps = { initialPage: AuditLogPage };

/**
 * Paginated audit log that updates only its own scrollable result region.
 *
 * @param root0 - Properties that configure audit log panel.
 * @param root0.initialPage - First server-rendered page of paginated records.
 * @returns The rendered audit log panel.
 */
export function AuditLogPanel({ initialPage }: AuditLogPanelProps): ReactNode {
  const format = useFormatter();
  const t = useTranslations();
  const [result, setResult] = useState(initialPage);
  const [pending, startTransition] = useTransition();

  /**
   * Loads one audit page while preserving the currently rendered results.
   *
   * @param page - One-based audit page number to request.
   * @returns Nothing.
   */
  function loadPage(page: number): void {
    if (pending || page < 1 || page > result.pages) return;
    startTransition(async () => {
      try {
        setResult(await getAuditLogPageAction(page));
      } catch {
        toast.error(t("admin.loadError"));
      }
    });
  }

  return (
    <PagedList
      listClassName="filter-options"
      loadingLabel={t("admin.loading")}
      navigationLabel={t("admin.trail")}
      onPageChange={loadPage}
      page={result.page}
      pageLabel={t("admin.auditPage", {
        page: result.page,
        pages: result.pages,
      })}
      pages={result.pages}
      pending={pending}
    >
      {result.events.map((event) => (
        <div
          className="hover:bg-muted/60 grid gap-1 rounded-lg px-3 py-3 text-sm sm:grid-cols-[1fr_180px] sm:items-center"
          key={event.id}
        >
          <div>
            <strong>{event.action}</strong>
            <span className="text-muted-foreground ml-2 text-xs">
              {event.actorName ?? t("admin.system")} · {event.targetType}
            </span>
          </div>
          <time className="text-muted-foreground text-xs sm:text-right">
            {format.dateTime(new Date(event.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </div>
      ))}
      {result.events.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {t("admin.noEvents")}
        </p>
      ) : null}
    </PagedList>
  );
}
