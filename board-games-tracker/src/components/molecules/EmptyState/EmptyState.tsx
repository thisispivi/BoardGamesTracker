import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Content of a placeholder shown where records would otherwise appear. */
type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon: LucideIcon;
  title?: string;
};

/**
 * Placeholder for a region that has no records to show.
 *
 * Covers both "nothing here yet", which supplies a title and an action, and
 * "nothing matched", which supplies only a short line of text.
 *
 * @param root0 - Properties that configure empty state.
 * @param root0.action - Optional control offering the next step.
 * @param root0.className - Optional classes merged with the component styles.
 * @param root0.description - Supporting sentence explaining the state.
 * @param root0.icon - Decorative glyph reinforcing the subject.
 * @param root0.title - Optional heading; omit it for a transient no-results state.
 * @returns The rendered empty state.
 */
export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps): ReactNode {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <Icon aria-hidden="true" className="text-accent mx-auto size-7" />
      {title === undefined ? null : (
        <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      )}
      {description === undefined ? null : (
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          {description}
        </p>
      )}
      {action === undefined ? null : <div className="mt-6">{action}</div>}
    </div>
  );
}
