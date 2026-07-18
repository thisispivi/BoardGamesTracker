"use client";

import { FileUp, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  importBggCsvAction,
  type CollectionActionState,
} from "@/server/actions/collection";

const initialState: CollectionActionState = { success: false, message: "" };

/** Dialog for securely importing an official BoardGameGeek CSV export. */
export function ImportCollectionDialog() {
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
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <FileUp className="size-4" /> {t("import.button")}
      </Button>
      {open && (
        <div
          className="modal-overlay fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <section
            className="modal-content bg-card w-full max-w-lg rounded-3xl border p-6 shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-labelledby="import-collection-title"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-primary text-xs font-bold tracking-widest uppercase">
                  {t("import.eyebrow")}
                </p>
                <h2
                  id="import-collection-title"
                  className="font-display mt-1 text-2xl font-bold"
                >
                  {t("import.title")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {t("import.body")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hover:bg-muted rounded-full p-2"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={action} className="mt-7 space-y-5">
              <label className="block text-sm font-bold">
                <span className="mb-2 block">{t("import.file")}</span>
                <input
                  name="collection"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="file:bg-primary file:text-primary-foreground bg-background w-full rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:px-4 file:py-2 file:font-bold"
                />
              </label>
              <div className="bg-muted/60 text-muted-foreground rounded-xl p-4 text-xs leading-5">
                {t("import.limit")}
              </div>
              <div className="flex justify-end border-t pt-5">
                <Button type="submit" disabled={importing}>
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
      )}
    </>
  );
}
