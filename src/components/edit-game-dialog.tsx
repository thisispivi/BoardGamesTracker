"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, Pencil, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import type { CollectionGame } from "@/components/game-card";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  type CollectionActionState,
  updateCollectionItemAction,
} from "@/server/actions/collection";

const initialState: CollectionActionState = { success: false, message: "" };

/** Modal editor for personal collection metadata and purchase spend. */
export function EditGameDialog({
  currency,
  game,
}: {
  currency: string;
  game: CollectionGame;
}) {
  const [open, setOpen] = useState(false);
  const t = useI18n();
  const [state, action, pending] = useActionState(
    updateCollectionItemAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      const timeout = window.setTimeout(() => setOpen(false), 0);
      return () => window.clearTimeout(timeout);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("game.editAria", { name: game.name })}
          className="text-muted-foreground hover:bg-muted hover:text-primary rounded-lg p-2 transition"
        >
          <Pencil className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="edit-dialog-overlay fixed inset-0 z-90 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-91 flex max-h-[calc(100dvh-0.5rem)] flex-col overflow-hidden rounded-t-3xl border p-0 shadow-2xl focus:outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-[min(calc(100vw-2rem),32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-7 sm:pt-7">
            <div className="min-w-0">
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                {t("edit.eyebrow")}
              </p>
              <Dialog.Title
                id={`edit-${game.id}`}
                className="font-display mt-1 line-clamp-2 text-xl font-bold sm:text-2xl"
              >
                {t("edit.title", { name: game.name })}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="hover:bg-muted shrink-0 rounded-full p-2"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="itemId" value={game.id} />
            <div className="min-h-0 space-y-5 overflow-y-auto px-5 pb-5 sm:px-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  <span className="mb-2 block">
                    {t("edit.money", { currency })}
                  </span>
                  <input
                    name="moneySpent"
                    type="number"
                    min={0}
                    max={999_999_999.99}
                    step="0.01"
                    defaultValue={game.moneySpent}
                    className="field-input"
                  />
                </label>
                <label className="text-sm font-bold">
                  <span className="mb-2 block">{t("edit.rating")}</span>
                  <input
                    name="personalRating"
                    type="number"
                    min={0}
                    max={10}
                    step="0.1"
                    defaultValue={game.personalRating ?? ""}
                    className="field-input"
                  />
                </label>
              </div>
              <label className="block text-sm font-bold">
                <span className="mb-2 block">{t("edit.notes")}</span>
                <textarea
                  name="notes"
                  maxLength={2_000}
                  rows={4}
                  defaultValue={game.notes}
                  className="field-input min-h-28 py-3"
                />
              </label>
            </div>
            <div className="bg-card flex shrink-0 flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending && <LoaderCircle className="size-4 animate-spin" />}
                {t("edit.save")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
