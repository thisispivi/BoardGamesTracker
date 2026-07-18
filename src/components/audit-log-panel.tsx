"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { AppSpinner } from "@/components/ui/app-spinner";
import { Button } from "@/components/ui/button";
import type { AuditLogPage } from "@/server/admin/audit-logs";
import { getAuditLogPageAction } from "@/server/actions/admin";

/** Paginated audit log that updates only its own scrollable result region. */
export function AuditLogPanel({ initialPage }: { initialPage: AuditLogPage }) {
  const format = useFormatter();
  const t = useTranslations();
  const [result, setResult] = useState(initialPage);
  const [pending, startTransition] = useTransition();

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
          {result.events.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("admin.noEvents")}
            </p>
          )}
        </div>
        {pending && (
          <div className="bg-card/72 absolute inset-0 grid place-items-center rounded-2xl backdrop-blur-[2px]">
            <div className="text-primary flex flex-col items-center gap-3 text-sm font-bold">
              <AppSpinner className="size-7" label={t("admin.loading")} />
              <span>{t("admin.loading")}</span>
            </div>
          </div>
        )}
      </div>
      <nav
        className="mt-5 flex items-center justify-between gap-4 border-t pt-5"
        aria-label={t("admin.trail")}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || result.page <= 1}
          onClick={() => loadPage(result.page - 1)}
        >
          <ChevronLeft className="size-4" /> {t("admin.previous")}
        </Button>
        <p className="text-muted-foreground text-xs font-bold tabular-nums">
          {t("admin.auditPage", {
            page: result.page,
            pages: result.pages,
          })}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || result.page >= result.pages}
          onClick={() => loadPage(result.page + 1)}
        >
          {t("admin.next")} <ChevronRight className="size-4" />
        </Button>
      </nav>
    </>
  );
}
