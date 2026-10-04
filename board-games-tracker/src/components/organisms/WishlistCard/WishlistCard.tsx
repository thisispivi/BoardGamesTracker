"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState, useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import { GiftedPriceField } from "@/components/molecules/GiftedPriceField/GiftedPriceField";
import { GameCardShell } from "@/components/organisms/GameCardShell/GameCardShell";
import type { CollectionActionState, CollectionGame } from "@/core";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import {
  moveWishlistToCollectionAction,
  removeGameAction,
} from "@/server/actions/collection";

const initialState: CollectionActionState = { success: false, message: "" };

/** Wishlist game and currency used by the purchase dialog. */
type PurchaseDialogProps = {
  currency: string;
  game: CollectionGame;
};

/**
 * Purchase dialog that promotes one wishlist item into the owned collection.
 *
 * @param root0 - Properties that configure purchase dialog.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns A dialog that moves a wishlist game into the collection.
 */
function PurchaseDialog({ currency, game }: PurchaseDialogProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    moveWishlistToCollectionAction,
    initialState,
  );
  const router = useRouter();
  const t = useTranslations();

  useActionFeedback(state, () => {
    router.refresh();
    setOpen(false);
  });

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Tooltip content={t("wishlist.purchaseHint")}>
        <Dialog.Trigger asChild>
          <button
            aria-label={t("wishlist.purchaseTitle", { name: game.name })}
            className="text-muted-foreground hover:bg-muted hover:text-accent grid size-8 shrink-0 cursor-pointer place-items-center rounded-full transition"
            type="button"
          >
            <ShoppingBag className="size-4" />
          </button>
        </Dialog.Trigger>
      </Tooltip>
      <Dialog.Portal>
        <Dialog.Overlay className="edit-dialog-overlay fixed inset-0 z-90 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-91 rounded-t-xl border p-6 shadow-2xl focus:outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-[min(calc(100vw-2rem),30rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                {t("wishlist.purchaseEyebrow")}
              </p>
              <Dialog.Title className="font-display mt-1 text-2xl font-bold">
                {t("wishlist.purchaseTitle", { name: game.name })}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label={t("common.close")}
                className="hover:bg-muted shrink-0 rounded-full p-2 transition"
                type="button"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <form action={action} className="mt-6 space-y-5">
            <input name="itemId" type="hidden" value={game.id} />
            <GiftedPriceField currency={currency} />
            <p className="text-muted-foreground text-sm leading-6">
              {t("wishlist.purchaseBody")}
            </p>
            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
              </Dialog.Close>
              <Button disabled={pending} type="submit">
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ShoppingBag className="size-4" />
                )}
                {t("wishlist.move")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Wishlist game, currency, and artwork priority shown by a card. */
type WishlistCardProps = {
  currency: string;
  eager?: boolean;
  game: CollectionGame;
};

/**
 * Horizontal wishlist card matching the collection card, with purchase and removal actions.
 *
 * @param root0 - Properties that configure wishlist card.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.game - Game record displayed or changed by the component.
 * @returns The rendered wishlist card.
 */
export function WishlistCard({
  currency,
  eager = false,
  game,
}: WishlistCardProps): ReactNode {
  const t = useTranslations();

  return (
    <GameCardShell
      actions={
        <>
          <PurchaseDialog currency={currency} game={game} />
          <ConfirmDialog
            action={removeGameAction}
            cancelLabel={t("common.cancel")}
            confirmLabel={t("wishlist.remove")}
            description={t("wishlist.removeBody")}
            fields={{ itemId: game.id }}
            title={t("wishlist.removeTitle", { name: game.name })}
            tooltip={t("wishlist.removeHint")}
            trigger={
              <button
                aria-label={t("wishlist.removeTitle", { name: game.name })}
                className="text-muted-foreground hover:bg-muted hover:text-danger grid size-8 shrink-0 cursor-pointer place-items-center rounded-full transition"
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            }
          />
        </>
      }
      eager={eager}
      game={game}
    />
  );
}
