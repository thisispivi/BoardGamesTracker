"use client";

import {
  Check,
  KeyRound,
  LoaderCircle,
  Shield,
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
import { cn } from "@/utils/cn";

/** Administrative user record accepted by account-management controls. */
type ManagedUser = { id: string; name: string; role: string; banned: boolean };

/** Current administrator context and target user for management actions. */
type AdminUserActionsProps = {
  user: ManagedUser;
  isSelf: boolean;
};

/**
 * Guarded administrator controls for one user record.
 *
 * @param root0 - Properties that configure admin user actions.
 * @param root0.user - Authenticated user displayed by the application shell.
 * @param root0.isSelf - Whether the managed account belongs to the current administrator.
 * @returns The rendered admin user actions.
 */
export function AdminUserActions({
  user,
  isSelf,
}: AdminUserActionsProps): ReactNode {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const [issuing, startIssuing] = useTransition();

  /**
   * Issues a reset link and puts it straight on the clipboard.
   *
   * The link is a credential, so it is never rendered: it goes to the clipboard
   * and nowhere else, which also keeps it off any shoulder-surfer's screen.
   *
   * @returns Nothing.
   */
  function copyResetLink(): void {
    const formData = new FormData();
    formData.set("userId", user.id);
    startIssuing(async () => {
      try {
        const link = await createPasswordResetLinkAction(formData);
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success(t("admin.resetCopied"));
        window.setTimeout(() => setCopied(false), 2_000);
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
    <div className="flex justify-end gap-1">
      <button
        aria-label={t("admin.resetPassword")}
        className={cn(
          "rounded-md p-2 transition disabled:opacity-50",
          copied
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-primary",
        )}
        disabled={issuing}
        onClick={copyResetLink}
        title={t("admin.resetPassword")}
        type="button"
      >
        {issuing ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : copied ? (
          <Check className="size-4" />
        ) : (
          <KeyRound className="size-4" />
        )}
      </button>
      <form action={updateUserRoleAction}>
        <input name="userId" type="hidden" value={user.id} />
        <input
          name="role"
          type="hidden"
          value={user.role === "admin" ? "user" : "admin"}
        />
        <button
          className="text-muted-foreground hover:bg-muted hover:text-primary rounded-md p-2"
          title={
            user.role === "admin" ? t("admin.removeRole") : t("admin.makeAdmin")
          }
          type="submit"
        >
          <Shield className="size-4" />
        </button>
      </form>
      <form action={toggleUserBanAction}>
        <input name="userId" type="hidden" value={user.id} />
        <input name="banned" type="hidden" value={String(!user.banned)} />
        <button
          className="text-muted-foreground hover:bg-muted hover:text-danger rounded-md p-2"
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
            className="text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-md p-2"
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
