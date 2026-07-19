"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ExternalLink,
  LoaderCircle,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { GameArtwork } from "@/components/game-artwork";
import type { CollectionGame } from "@/components/game-card";
import { GiftedPriceField } from "@/components/gifted-price-field";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  type CollectionActionState,
  moveWishlistToCollectionAction,
  removeGameAction,
} from "@/server/actions/collection";

const initialState: CollectionActionState = { success: false, message: "" };

/** Purchase dialog that promotes one wishlist item into the owned collection. */
function PurchaseDialog({
  currency,
  game,
}: {
  currency: string;
  game: CollectionGame;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    moveWishlistToCollectionAction,
    initialState,
  );
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      router.refresh();
      const timeout = window.setTimeout(() => setOpen(false), 0);
      return () => window.clearTimeout(timeout);
    } else {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <Button className="flex-1" size="sm" type="button">
          <ShoppingBag className="size-4" /> {t("wishlist.purchased")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="edit-dialog-overlay fixed inset-0 z-90 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="edit-dialog-content bg-card fixed inset-x-0 bottom-0 z-91 rounded-t-3xl border p-6 shadow-2xl focus:outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-[min(calc(100vw-2rem),30rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-8">
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

/** Square wishlist card with purchase, BGG, and removal actions. */
export function WishlistCard({
  currency,
  game,
}: {
  currency: string;
  game: CollectionGame;
}) {
  const t = useTranslations();
  const tags = [...new Set([...game.categories, ...game.mechanics])].slice(
    0,
    4,
  );

  return (
    <article className="bg-card shadow-soft rounded-3xl border p-3">
      <div className="group relative overflow-hidden rounded-[1.2rem]">
        <GameArtwork
          className="rounded-[1.2rem]"
          imageClassName="transition duration-300 group-hover:scale-105 group-hover:blur-sm group-focus-within:scale-105 group-focus-within:blur-sm"
          imageUrl={game.imageUrl}
          name={game.name}
        />
        <a
          aria-label={t("game.openBggAria", { name: game.name })}
          className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100"
          href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg">
            <ExternalLink className="size-4" /> {t("game.openBgg")}
          </span>
        </a>
      </div>
      <div className="px-1 pt-4">
        <h2 className="font-display line-clamp-2 text-lg font-bold">
          {game.name}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {game.yearPublished ?? t("common.yearUnknown")}
        </p>
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                className="bg-muted text-muted-foreground max-w-full truncate rounded-full px-2.5 py-1 text-[0.68rem] font-semibold"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-2 border-t pt-3">
          <PurchaseDialog currency={currency} game={game} />
          <ConfirmDialog
            action={removeGameAction}
            cancelLabel={t("common.cancel")}
            confirmLabel={t("wishlist.remove")}
            description={t("wishlist.removeBody")}
            fields={{ itemId: game.id }}
            title={t("wishlist.removeTitle", { name: game.name })}
            trigger={
              <Button
                aria-label={t("wishlist.removeTitle", { name: game.name })}
                size="icon"
                type="button"
                variant="secondary"
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </div>
      </div>
    </article>
  );
}
