"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/atoms/Button/Button";

/** Properties that configure a destructive-action confirmation dialog. */
type ConfirmDialogProps = {
  action: (formData: FormData) => Promise<void>;
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  fields: Record<string, string>;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  title: string;
  trigger: React.ReactNode;
};

/**
 * Animated in-app confirmation dialog for a server-side form action.
 *
 * @param root0 - Properties that configure confirm dialog.
 * @param root0.action - Server action invoked by the form.
 * @param root0.cancelLabel - Localized label for the cancel control.
 * @param root0.confirmLabel - Localized label for the confirmation control.
 * @param root0.description - Localized explanatory text shown to the user.
 * @param root0.fields - Additional form controls rendered in the dialog.
 * @param root0.passwordLabel - The optional deletion-password label.
 * @param root0.passwordPlaceholder - The optional deletion-password placeholder.
 * @param root0.title - Localized heading displayed by the component.
 * @param root0.trigger - Interactive element that opens the dialog.
 * @returns The rendered confirm dialog.
 */
export function ConfirmDialog({
  action,
  cancelLabel,
  confirmLabel,
  description,
  fields,
  passwordLabel,
  passwordPlaceholder,
  title,
  trigger,
}: ConfirmDialogProps): ReactNode {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay fixed inset-0 z-90 bg-black/55 backdrop-blur-sm" />
        <AlertDialog.Content className="dialog-content bg-card fixed top-1/2 left-1/2 z-91 w-[calc(100%-2rem)] max-w-md rounded-3xl border p-6 shadow-2xl sm:p-8">
          <span className="bg-danger/10 text-danger grid size-12 place-items-center rounded-2xl">
            <TriangleAlert className="size-5" />
          </span>
          <AlertDialog.Title className="font-display mt-5 text-2xl font-bold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-muted-foreground mt-3 text-sm leading-6">
            {description}
          </AlertDialog.Description>
          <form action={action} className="mt-7 space-y-5">
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} name={name} type="hidden" value={value} />
            ))}
            {passwordLabel ? (
              <label className="block text-sm font-bold">
                <span className="mb-2 block">{passwordLabel}</span>
                <input
                  autoComplete="current-password"
                  className="field-input"
                  name="password"
                  placeholder={passwordPlaceholder}
                  required
                  type="password"
                />
              </label>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="secondary">
                  {cancelLabel}
                </Button>
              </AlertDialog.Cancel>
              <Button type="submit" variant="danger">
                {confirmLabel}
              </Button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
