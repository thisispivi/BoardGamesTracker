"use client";

import {
  KeyRound,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import {
  createPasswordResetLinkAction,
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
  const [resetLink, setResetLink] = useState("");
  const [issuing, startIssuing] = useTransition();

  /** Requests a fresh reset link and shows it for the admin to pass along. */
  function issueResetLink(): void {
    const formData = new FormData();
    formData.set("userId", user.id);
    startIssuing(async () => {
      try {
        setResetLink(await createPasswordResetLinkAction(formData));
      } catch {
        toast.error(t("admin.resetFailed"));
      }
    });
  }

  if (isSelf) {
    return (
      <span className="text-muted-foreground block text-right text-xs">
        {t("admin.current")}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {resetLink ? (
        <div className="w-full max-w-md rounded-xl border p-2 text-left">
          <p className="text-muted-foreground mb-1 text-[0.68rem] leading-4">
            {t("admin.resetHint")}
          </p>
          <code className="bg-muted block w-full overflow-x-auto rounded-lg px-2 py-1 text-[0.68rem] break-all">
            {resetLink}
          </code>
        </div>
      ) : null}
      <div className="flex justify-end gap-1">
        <button
          className="text-muted-foreground hover:bg-muted hover:text-primary rounded-lg p-2 disabled:opacity-50"
          disabled={issuing}
          onClick={issueResetLink}
          title={t("admin.resetPassword")}
          type="button"
        >
          <KeyRound className="size-4" />
        </button>
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
              user.role === "admin"
                ? t("admin.removeRole")
                : t("admin.makeAdmin")
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
    </div>
  );
}
