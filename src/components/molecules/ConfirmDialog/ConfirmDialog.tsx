"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/atoms/Button/Button";

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
 * @param root0 - Component or function properties.
 * @param root0.action - The 'action' property.
 * @param root0.cancelLabel - The 'cancelLabel' property.
 * @param root0.confirmLabel - The 'confirmLabel' property.
 * @param root0.description - The 'description' property.
 * @param root0.fields - The 'fields' property.
 * @param root0.passwordLabel - The optional deletion-password label.
 * @param root0.passwordPlaceholder - The optional deletion-password placeholder.
 * @param root0.title - The 'title' property.
 * @param root0.trigger - The 'trigger' property.
 * @returns The documented function result.
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
