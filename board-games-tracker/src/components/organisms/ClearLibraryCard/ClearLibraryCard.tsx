"use client";

import { LoaderCircle, Trash2, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState, useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import type { CollectionActionState } from "@/core";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { clearLibraryAction } from "@/server/actions/collection";
import { cn } from "@/utils/cn";
import { clearCollectionConfirmation } from "@/utils/collectionConfirmation";

const initialState: CollectionActionState = { success: false, message: "" };

/** Library section targeted by the destructive clear operation. */
type ClearLibraryCardProps = {
  className?: string;
  library: "collection" | "wishlist";
};

/**
 * Destructive settings card for clearing one of the signed-in user's libraries.
 *
 * @param root0 - Properties that configure clear library card.
 * @param root0.className - Classes merged with the card, typically its grid placement.
 * @param root0.library - Library section whose games will be deleted.
 * @returns The rendered clear library card.
 */
export function ClearLibraryCard({
  className,
  library,
}: ClearLibraryCardProps): ReactNode {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, clearing] = useActionState(
    clearLibraryAction,
    initialState,
  );
  const router = useRouter();
  const isWishlist = library === "wishlist";
  const titleId = `clear-${library}-title`;

  useActionFeedback(state, () => {
    router.refresh();
    setOpen(false);
    setConfirmation("");
  });

  return (
    <section
      className={cn(
        "bg-card shadow-soft border-danger/25 rounded-xl border p-5 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <span className="bg-danger/10 text-danger grid size-12 shrink-0 place-items-center rounded-lg">
            <TriangleAlert className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">
              {t(isWishlist ? "clear.wishlistTitle" : "clear.title")}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
              {t(isWishlist ? "clear.wishlistBody" : "clear.body")}
            </p>
          </div>
        </div>
        <Button
          className="w-full shrink-0 sm:w-fit"
          onClick={() => setOpen(true)}
          type="button"
          variant="danger"
        >
          <Trash2 className="size-4" /> {t("clear.deleteAll")}
        </Button>
      </div>

      {open ? (
        <div
          className="modal-overlay fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="modal-content bg-card border-danger/30 w-full max-w-lg rounded-xl border p-6 shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-danger text-xs font-bold tracking-widest uppercase">
                  {t("clear.eyebrow")}
                </p>
                <h2
                  className="font-display mt-1 text-2xl font-bold"
                  id={titleId}
                >
                  {t(
                    isWishlist
                      ? "clear.wishlistModalTitle"
                      : "clear.modalTitle",
                  )}
                </h2>
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

            <p className="text-muted-foreground mt-5 text-sm leading-6">
              {t("clear.warning", {
                confirmation: clearCollectionConfirmation,
              })}
            </p>
            <form action={action} className="mt-6 space-y-5">
              <input name="library" type="hidden" value={library} />
              <label className="block text-sm font-bold">
                <span className="mb-2 block">{t("clear.confirmation")}</span>
                <input
                  autoComplete="off"
                  className="field-input"
                  name="confirmation"
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder={clearCollectionConfirmation}
                  required
                  spellCheck={false}
                  value={confirmation}
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
                <Button
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  disabled={
                    clearing || confirmation !== clearCollectionConfirmation
                  }
                  type="submit"
                  variant="danger"
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
      ) : null}
    </section>
  );
}
