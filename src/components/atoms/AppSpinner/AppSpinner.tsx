import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type AppSpinnerProps = {
  className?: string;
  label: string;
};

/** Brand-colored loading indicator with no visible status copy. */
export function AppSpinner({ className, label }: AppSpinnerProps): ReactNode {
  return (
    <span
      aria-label={label}
      className={cn("app-spinner", className)}
      role="status"
    />
  );
}
