"use client";

import * as Popover from "@radix-ui/react-popover";
import { EllipsisVertical, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import { EditGameDialog } from "@/components/organisms/EditGameDialog/EditGameDialog";
import type { CollectionGame } from "@/core";
import { removeGameAction } from "@/server/actions/collection";
import { cn } from "@/utils/cn";

/** Shared layout of one row inside the overflow menu. */
const menuItemClass =
  "hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition";

/** Game and currency used by the per-card overflow menu. */
type GameActionsMenuProps = {
  currency: string;
  game: CollectionGame;
};

/**
 * Overflow menu offering the edit, BoardGameGeek, and removal actions of a game.
 *
 * The menu closes before either dialog opens, so focus moves from the trigger
 * into the dialog instead of into a control that is about to unmount.
 *
 * @param root0 - Properties that configure the actions menu.
 * @param root0.currency - ISO currency code used to format monetary values.
 * @param root0.game - Game record the actions apply to.
 * @returns The rendered actions menu together with the dialogs it opens.
 */
export function GameActionsMenu({
  currency,
  game,
}: GameActionsMenuProps): ReactNode {
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <>
      <Popover.Root onOpenChange={setMenuOpen} open={menuOpen}>
        <Popover.Trigger asChild>
          <button
            aria-label={t("game.moreActions", { name: game.name })}
            className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 shrink-0 place-items-center rounded-full transition"
            type="button"
          >
            <EllipsisVertical className="size-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            className="popover-content bg-card z-80 w-48 rounded-lg border p-1.5 shadow-2xl"
            collisionPadding={12}
            sideOffset={6}
          >
            <button
              className={menuItemClass}
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
              type="button"
            >
              <Pencil className="size-4 shrink-0" />
              {t("game.edit")}
            </button>
            <a
              className={menuItemClass}
              href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
              onClick={() => setMenuOpen(false)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-4 shrink-0" />
              {t("game.openBgg")}
            </a>
            <button
              className={cn(
                menuItemClass,
                "text-danger hover:bg-danger/10 focus-visible:bg-danger/10",
              )}
              onClick={() => {
                setMenuOpen(false);
                setRemoveOpen(true);
              }}
              type="button"
            >
              <Trash2 className="size-4 shrink-0" />
              {t("game.remove")}
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <EditGameDialog
        currency={currency}
        game={game}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <ConfirmDialog
        action={removeGameAction}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("game.remove")}
        description={t("game.removeBody")}
        fields={{ itemId: game.id }}
        onOpenChange={setRemoveOpen}
        open={removeOpen}
        title={t("game.removeTitle", { name: game.name })}
      />
    </>
  );
}
