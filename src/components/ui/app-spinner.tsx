import { cn } from "@/lib/utils";

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
      role="status"
      aria-label={label}
      className={cn("app-spinner", className)}
    />
  );
}
