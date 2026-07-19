"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/atoms/Button/Button";

/** Animated in-app confirmation dialog for a server-side form action. */
export function ConfirmDialog({
  action,
  cancelLabel,
  confirmLabel,
  description,
  fields,
  title,
  trigger,
}: {
  action: (formData: FormData) => Promise<void>;
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  fields: Record<string, string>;
  title: string;
  trigger: React.ReactNode;
}) {
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
          <form action={action} className="mt-7 flex justify-end gap-2">
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} name={name} type="hidden" value={value} />
            ))}
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="secondary">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button type="submit" variant="danger">
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
