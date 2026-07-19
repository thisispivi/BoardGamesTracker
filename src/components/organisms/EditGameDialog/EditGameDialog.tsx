"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button/Button";
import { GiftedPriceField } from "@/components/molecules/GiftedPriceField/GiftedPriceField";
import type { CollectionActionState, CollectionGame } from "@/core";
import { updateCollectionItemAction } from "@/server/actions/collection";

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
  const t = useTranslations();
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
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <button
          aria-label={t("game.editAria", { name: game.name })}
          className="text-muted-foreground hover:bg-muted hover:text-primary rounded-lg p-2 transition"
          type="button"
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
                className="font-display mt-1 line-clamp-2 text-xl font-bold sm:text-2xl"
                id={`edit-${game.id}`}
              >
                {t("edit.title", { name: game.name })}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label={t("common.close")}
                className="hover:bg-muted shrink-0 rounded-full p-2"
                type="button"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <input name="itemId" type="hidden" value={game.id} />
            <div className="min-h-0 space-y-5 overflow-y-auto px-5 pb-5 sm:px-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <GiftedPriceField
                  className="sm:col-span-2"
                  companionField={
                    <label className="text-sm font-bold">
                      <span className="mb-2 block">{t("edit.rating")}</span>
                      <input
                        className="field-input"
                        defaultValue={game.personalRating ?? ""}
                        max={10}
                        min={0}
                        name="personalRating"
                        step="0.1"
                        type="number"
                      />
                    </label>
                  }
                  currency={currency}
                  defaultGifted={game.gifted}
                  defaultValue={game.moneySpent}
                />
              </div>
              <label className="block text-sm font-bold">
                <span className="mb-2 block">{t("edit.notes")}</span>
                <textarea
                  className="field-input min-h-28 py-3"
                  defaultValue={game.notes}
                  maxLength={2_000}
                  name="notes"
                  rows={4}
                />
              </label>
            </div>
            <div className="bg-card flex shrink-0 flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
              </Dialog.Close>
              <Button disabled={pending} type="submit">
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                {t("edit.save")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
