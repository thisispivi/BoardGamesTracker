"use client";

import { Download, FileArchive, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/atoms/Button/Button";
import { ImportCollectionDialog } from "@/components/organisms/ImportCollectionDialog/ImportCollectionDialog";
import { userDataImportResponseSchema } from "@/core";
import { cn } from "@/utils/cn";

const formats = ["json", "csv", "xlsx", "sql"] as const;

/** Optional placement classes for the portable-data card. */
type UserDataCardProps = {
  className?: string;
};

/**
 * Export and restore controls for the current user's portable app data.
 *
 * @param root0 - Properties that place the card.
 * @param root0.className - Classes merged with the card, typically its grid placement.
 * @returns The rendered user data card.
 */
export function UserDataCard({ className }: UserDataCardProps): ReactNode {
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const t = useTranslations("data");

  /**
   * Uploads a bounded portable export to the authenticated import endpoint.
   *
   * @param event - Form submission event whose default navigation is suppressed.
   * @returns A promise that resolves after the selected import is processed.
   */
  async function importData(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setImporting(true);
    try {
      const response = await fetch("/api/user-data", {
        method: "POST",
        body: new FormData(form),
      });
      const payload = userDataImportResponseSchema.safeParse(
        await response.json(),
      );
      if (!response.ok || !payload.success || !payload.data.success) {
        const error = payload.success ? payload.data.error : undefined;
        toast.error(
          error === "too_large"
            ? t("tooLarge")
            : error === "too_many_requests"
              ? t("tooMany")
              : error === "unsupported_format"
                ? t("unsupported")
                : error === "import_failed" || response.status >= 500
                  ? t("serverError")
                  : t("invalid"),
        );
        return;
      }
      toast.success(t("imported", { count: payload.data.imported }));
      form.reset();
      router.refresh();
    } catch {
      toast.error(t("invalid"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <section
      className={cn(
        "bg-card shadow-soft max-w-full min-w-0 overflow-hidden rounded-xl border p-5 sm:p-8",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
          <FileArchive className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("body")}</p>
        </div>
      </div>

      <div className="mt-7 grid min-w-0 gap-4">
        <div className="min-w-0 rounded-lg border p-4 sm:p-5">
          <h3 className="font-bold">{t("exportTitle")}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("exportBody")}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {formats.map((format) => (
              <a
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                )}
                download
                href={`/api/user-data?format=${format}`}
                key={format}
              >
                <Download className="size-4" /> {format.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        <form
          className="min-w-0 rounded-lg border p-4 sm:p-5"
          onSubmit={importData}
        >
          <h3 className="font-bold">{t("importTitle")}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("importBody")}
          </p>
          <label className="mt-4 block min-w-0 text-sm font-bold">
            <span className="sr-only">{t("file")}</span>
            <input
              accept=".json,.csv,.xlsx,.sql,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/sql"
              className="file:bg-primary file:text-primary-foreground bg-background block w-full max-w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border p-2 text-sm file:mr-3 file:max-w-full file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-2 file:font-bold"
              name="file"
              required
              type="file"
            />
          </label>
          <Button
            className="mt-4 w-full sm:w-fit"
            disabled={importing}
            size="sm"
            type="submit"
          >
            {importing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {importing ? t("importing") : t("import")}
          </Button>
        </form>
      </div>

      <div className="mt-6 flex min-w-0 flex-col justify-between gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0">
          <h3 className="font-bold">{t("bggTitle")}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{t("bggBody")}</p>
        </div>
        <ImportCollectionDialog />
      </div>
    </section>
  );
}
