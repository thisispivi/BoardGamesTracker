"use client";

import { LoaderCircle, Trash2, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import {
  clearCollectionAction,
  type CollectionActionState,
} from "@/server/actions/collection";

const initialState: CollectionActionState = { success: false, message: "" };

/** Destructive settings card for clearing the signed-in user's collection. */
export function ClearCollectionCard() {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, clearing] = useActionState(
    clearCollectionAction,
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
      const timeout = window.setTimeout(() => {
        setOpen(false);
        setConfirmation("");
      }, 0);
      return () => window.clearTimeout(timeout);
    }
    toast.error(state.message);
  }, [router, state]);

  return (
    <section className="bg-card shadow-soft h-full rounded-3xl border border-red-500/25 p-6 sm:p-8">
      <div className="flex h-full flex-col justify-between gap-7">
        <div className="flex items-start gap-4">
          <span className="bg-danger/10 text-danger grid size-12 shrink-0 place-items-center rounded-2xl">
            <TriangleAlert className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">
              {t("clear.title")}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
              {t("clear.body")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="danger"
          className="w-full shrink-0 sm:w-fit"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" /> {t("clear.deleteAll")}
        </Button>
      </div>

      {open && (
        <div
          className="modal-overlay fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <section
            className="modal-content bg-card w-full max-w-lg rounded-3xl border border-red-500/30 p-6 shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-labelledby="clear-collection-title"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-danger text-xs font-bold tracking-widest uppercase">
                  {t("clear.eyebrow")}
                </p>
                <h2
                  id="clear-collection-title"
                  className="font-display mt-1 text-2xl font-bold"
                >
                  {t("clear.modalTitle")}
                </h2>
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

            <p className="text-muted-foreground mt-5 text-sm leading-6">
              {t("clear.warning")}
            </p>
            <form action={action} className="mt-6 space-y-5">
              <label className="block text-sm font-bold">
                <span className="mb-2 block">{t("clear.confirmation")}</span>
                <input
                  name="confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  required
                  className="field-input"
                  placeholder="DELETE"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={clearing || confirmation !== "DELETE"}
                >
                  {clearing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {clearing ? t("clear.deleting") : t("clear.submit")}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
