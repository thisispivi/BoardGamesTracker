import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

import type { CollectionActionState } from "@/core";

/**
 * Toasts each new server-action outcome and runs a callback after a success.
 *
 * The callback is deferred by one task so it may close the dialog that owns
 * the form without setting state synchronously inside the effect, and it is
 * read through an effect event so an inline closure never re-announces an
 * outcome that was already shown.
 *
 * @param state - Latest state returned by `useActionState`.
 * @param onSuccess - Work to run once a successful outcome has been announced.
 * @returns Nothing.
 */
export function useActionFeedback(
  state: CollectionActionState,
  onSuccess: () => void,
): void {
  const succeed = useEffectEvent(onSuccess);

  useEffect(() => {
    if (!state.message) return;
    if (!state.success) {
      toast.error(state.message);
      return;
    }
    toast.success(state.message);
    const timeout = window.setTimeout(succeed, 0);
    return () => window.clearTimeout(timeout);
  }, [state]);
}
