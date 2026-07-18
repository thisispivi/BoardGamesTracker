"use client";

import { Download, FileArchive, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ImportCollectionDialog } from "@/components/import-collection-dialog";
import { useI18n } from "@/components/i18n-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formats = ["json", "csv", "xlsx", "sql"] as const;

/** Export and restore controls for the current user's portable app data. */
export function UserDataCard() {
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const t = useI18n();

  /** Uploads a bounded portable export to the authenticated import endpoint. */
  async function importData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setImporting(true);
    try {
      const response = await fetch("/api/user-data", {
        method: "POST",
        body: new FormData(form),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        imported?: number;
        error?: string;
      };
      if (!response.ok || !payload.success) {
        toast.error(
          payload.error === "too_large"
            ? t("data.tooLarge")
            : payload.error === "unsupported_format"
              ? t("data.unsupported")
              : t("data.invalid"),
        );
        return;
      }
      toast.success(t("data.imported", { count: payload.imported ?? 0 }));
      form.reset();
      router.refresh();
    } catch {
      toast.error(t("data.invalid"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="bg-card shadow-soft h-full rounded-3xl border p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
          <FileArchive className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">{t("data.title")}</h2>
          <p className="text-muted-foreground text-sm">{t("data.body")}</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h3 className="font-bold">{t("data.exportTitle")}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("data.exportBody")}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {formats.map((format) => (
              <a
                key={format}
                href={`/api/user-data?format=${format}`}
                download
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                )}
              >
                <Download className="size-4" /> {format.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        <form onSubmit={importData} className="rounded-2xl border p-5">
          <h3 className="font-bold">{t("data.importTitle")}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("data.importBody")}
          </p>
          <label className="mt-4 block text-sm font-bold">
            <span className="sr-only">{t("data.file")}</span>
            <input
              name="file"
              type="file"
              accept=".json,.csv,.xlsx,.sql,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/sql"
              required
              className="file:bg-primary file:text-primary-foreground bg-background w-full cursor-pointer rounded-xl border p-2 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:px-3 file:py-2 file:font-bold"
            />
          </label>
          <Button type="submit" size="sm" disabled={importing} className="mt-4">
            {importing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {importing ? t("data.importing") : t("data.import")}
          </Button>
        </form>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-bold">{t("data.bggTitle")}</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("data.bggBody")}
          </p>
        </div>
        <ImportCollectionDialog />
      </div>
    </section>
  );
}
