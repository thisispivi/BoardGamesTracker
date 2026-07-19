import { cn } from "@/utils/cn";

/** Brand-colored loading indicator with no visible status copy. */
export function AppSpinner({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <span
      aria-label={label}
      className={cn("app-spinner", className)}
      role="status"
    />
  );
}
