import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type AppSpinnerProps = {
  className?: string;
  label: string;
};

/**
 * Brand-colored loading indicator with no visible status copy.
 *
 * @param root0 - Component or function properties.
 * @param root0.className - The 'className' property.
 * @param root0.label - The 'label' property.
 * @returns The documented function result.
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
