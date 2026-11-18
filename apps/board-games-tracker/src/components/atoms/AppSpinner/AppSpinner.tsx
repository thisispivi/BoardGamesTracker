import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Properties that configure the application loading indicator. */
type AppSpinnerProps = {
  className?: string;
  label: string;
};

/**
 * Brand-colored loading indicator with no visible status copy.
 *
 * @param root0 - Properties that configure app spinner.
 * @param root0.className - Optional classes merged with the component styles.
 * @param root0.label - Localized label displayed by the control.
 * @returns The rendered app spinner.
 */
export function AppSpinner({ className, label }: AppSpinnerProps): ReactNode {
  return (
    <span
      aria-label={label}
      className={cn("app-spinner", className)}
      role="status"
    />
  );
}
