"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { AppSpinner } from "@/components/ui/app-spinner";
import { Button } from "@/components/ui/button";
import type { AuditLogPage } from "@/server/admin/audit-logs";
import { getAuditLogPageAction } from "@/server/actions/admin";

type AuditLogLabels = {
  loadError: string;
  loading: string;
  next: string;
  noEvents: string;
  page: string;
  previous: string;
  system: string;
  trail: string;
};

/** Paginated audit log that updates only its own scrollable result region. */
export function AuditLogPanel({
  initialPage,
  labels,
  locale,
}: {
  initialPage: AuditLogPage;
  labels: AuditLogLabels;
  locale: string;
}) {
  const [result, setResult] = useState(initialPage);
  const [pending, startTransition] = useTransition();

  function loadPage(page: number): void {
    if (pending || page < 1 || page > result.pages) return;
    startTransition(async () => {
      try {
        setResult(await getAuditLogPageAction(page));
      } catch {
        toast.error(labels.loadError);
      }
    });
  }

  return (
    <>
      <div className="relative min-h-32" aria-busy={pending}>
        <div
          className={`filter-options max-h-[32rem] space-y-1 overflow-y-auto overscroll-contain pr-1 transition-opacity ${pending ? "opacity-35" : "opacity-100"}`}
        >
          {result.events.map((event) => (
            <div
              key={event.id}
              className="hover:bg-muted/60 grid gap-1 rounded-xl px-3 py-3 text-sm sm:grid-cols-[1fr_180px] sm:items-center"
            >
              <div>
                <strong>{event.action}</strong>
                <span className="text-muted-foreground ml-2 text-xs">
                  {event.actorName ?? labels.system} · {event.targetType}
                </span>
              </div>
              <time className="text-muted-foreground text-xs sm:text-right">
                {new Date(event.createdAt).toLocaleString(locale)}
              </time>
            </div>
          ))}
          {result.events.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {labels.noEvents}
            </p>
          )}
        </div>
        {pending && (
          <div className="bg-card/72 absolute inset-0 grid place-items-center rounded-2xl backdrop-blur-[2px]">
            <div className="text-primary flex flex-col items-center gap-3 text-sm font-bold">
              <AppSpinner className="size-7" label={labels.loading} />
              <span>{labels.loading}</span>
            </div>
          </div>
        )}
      </div>
      <nav
        className="mt-5 flex items-center justify-between gap-4 border-t pt-5"
        aria-label={labels.trail}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || result.page <= 1}
          onClick={() => loadPage(result.page - 1)}
        >
          <ChevronLeft className="size-4" /> {labels.previous}
        </Button>
        <p className="text-muted-foreground text-xs font-bold tabular-nums">
          {labels.page
            .replace("{page}", String(result.page))
            .replace("{pages}", String(result.pages))}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || result.page >= result.pages}
          onClick={() => loadPage(result.page + 1)}
        >
          {labels.next} <ChevronRight className="size-4" />
        </Button>
      </nav>
    </>
  );
}
