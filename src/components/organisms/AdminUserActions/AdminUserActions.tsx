"use client";

import { ShieldCheck, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import {
  deleteUserAction,
  toggleUserBanAction,
  updateUserRoleAction,
} from "@/server/actions/admin";

type ManagedUser = { id: string; name: string; role: string; banned: boolean };

type AdminUserActionsProps = {
  user: ManagedUser;
  isSelf: boolean;
};

/**
 * Guarded administrator controls for one user record.
 *
 * @param root0 - Component or function properties.
 * @param root0.user - The 'user' property.
 * @param root0.isSelf - The 'isSelf' property.
 * @returns The documented function result.
 */
export function AdminUserActions({
  user,
  isSelf,
}: AdminUserActionsProps): ReactNode {
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
        <input name="userId" type="hidden" value={user.id} />
        <input
          name="role"
          type="hidden"
          value={user.role === "admin" ? "user" : "admin"}
        />
        <button
          className="text-muted-foreground hover:bg-muted hover:text-primary rounded-lg p-2"
          title={
            user.role === "admin" ? t("admin.removeRole") : t("admin.makeAdmin")
          }
          type="submit"
        >
          <ShieldCheck className="size-4" />
        </button>
      </form>
      <form action={toggleUserBanAction}>
        <input name="userId" type="hidden" value={user.id} />
        <input name="banned" type="hidden" value={String(!user.banned)} />
        <button
          className="text-muted-foreground hover:bg-muted hover:text-danger rounded-lg p-2"
          title={user.banned ? t("admin.restore") : t("admin.ban")}
          type="submit"
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
        cancelLabel={t("common.cancel")}
        confirmLabel={t("admin.delete")}
        description={t("admin.deleteBody")}
        fields={{ userId: user.id }}
        title={t("admin.deleteTitle", { name: user.name })}
        trigger={
          <button
            className="text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg p-2"
            title={t("admin.delete")}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        }
      />
    </div>
  );
}
