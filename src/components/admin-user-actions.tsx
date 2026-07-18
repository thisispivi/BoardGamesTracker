"use client";

import { ShieldCheck, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "next-intl";
import {
  deleteUserAction,
  toggleUserBanAction,
  updateUserRoleAction,
} from "@/server/actions/admin";

type ManagedUser = { id: string; name: string; role: string; banned: boolean };

/** Guarded administrator controls for one user record. */
export function AdminUserActions({
  user,
  isSelf,
}: {
  user: ManagedUser;
  isSelf: boolean;
}) {
  const t = useTranslations();
  if (isSelf) {
    return (
      <span className="text-muted-foreground block text-right text-xs">
        {t("admin.current")}
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-1">
      <form action={updateUserRoleAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input
          type="hidden"
          name="role"
          value={user.role === "admin" ? "user" : "admin"}
        />
        <button
          type="submit"
          title={
            user.role === "admin" ? t("admin.removeRole") : t("admin.makeAdmin")
          }
          className="text-muted-foreground hover:bg-muted hover:text-primary rounded-lg p-2"
        >
          <ShieldCheck className="size-4" />
        </button>
      </form>
      <form action={toggleUserBanAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="banned" value={String(!user.banned)} />
        <button
          type="submit"
          title={user.banned ? t("admin.restore") : t("admin.ban")}
          className="text-muted-foreground hover:bg-muted hover:text-danger rounded-lg p-2"
        >
          {user.banned ? (
            <UserRoundCheck className="size-4" />
          ) : (
            <UserRoundX className="size-4" />
          )}
        </button>
      </form>
      <ConfirmDialog
        action={deleteUserAction}
        title={t("admin.deleteTitle", { name: user.name })}
        description={t("admin.deleteBody")}
        confirmLabel={t("admin.delete")}
        cancelLabel={t("common.cancel")}
        fields={{ userId: user.id }}
        trigger={
          <button
            type="button"
            title={t("admin.delete")}
            className="text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg p-2"
          >
            <Trash2 className="size-4" />
          </button>
        }
      />
    </div>
  );
}
