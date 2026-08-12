"use client";

import { FileUp, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button/Button";
import type { CollectionActionState } from "@/core";
import { importBggCsvAction } from "@/server/actions/collection";

const initialState: CollectionActionState = { success: false, message: "" };

/**
 * Dialog for securely importing an official BoardGameGeek CSV export.
 *
 * @returns The rendered import collection dialog.
 */
export function ImportCollectionDialog(): ReactNode {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [state, action, importing] = useActionState(
    importBggCsvAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.success) {
      toast.success(state.message);
      router.refresh();
      const timeout = window.setTimeout(() => setOpen(false), 0);
      return () => window.clearTimeout(timeout);
    }
    toast.error(state.message);
  }, [router, state]);

  return (
    <>
      <Button
        className="w-full max-w-full sm:w-fit"
        onClick={() => setOpen(true)}
        type="button"
        variant="secondary"
      >
        <FileUp className="size-4" /> {t("import.button")}
      </Button>
      {open ? (
        <div
          className="modal-overlay fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <section
            aria-labelledby="import-collection-title"
            aria-modal="true"
            className="modal-content bg-card max-h-[calc(100dvh-2rem)] w-full max-w-lg min-w-0 overflow-x-hidden overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-primary text-xs font-bold tracking-widest uppercase">
                  {t("import.eyebrow")}
                </p>
                <h2
                  className="font-display mt-1 text-2xl font-bold"
                  id="import-collection-title"
                >
                  {t("import.title")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {t("import.body")}
                </p>
              </div>
              <button
                aria-label={t("common.close")}
                className="hover:bg-muted rounded-full p-2"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={action} className="mt-7 min-w-0 space-y-5">
              <label className="block min-w-0 text-sm font-bold">
                <span className="mb-2 block">{t("import.file")}</span>
                <input
                  accept=".csv,text/csv"
                  className="file:bg-primary file:text-primary-foreground bg-background block w-full max-w-full min-w-0 overflow-hidden rounded-xl border p-2 text-sm file:mr-3 file:max-w-full file:rounded-lg file:border-0 file:px-4 file:py-2 file:font-bold"
                  name="collection"
                  required
                  type="file"
                />
              </label>
              <div className="bg-muted/60 text-muted-foreground rounded-xl p-4 text-xs leading-5">
                {t("import.limit")}
              </div>
              <div className="flex justify-end border-t pt-5">
                <Button
                  className="w-full sm:w-fit"
                  disabled={importing}
                  type="submit"
                >
                  {importing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <FileUp className="size-4" />
                  )}
                  {importing ? t("import.pending") : t("import.submit")}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
