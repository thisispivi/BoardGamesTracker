import { UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/initials";

/** Identity and sizing of the account avatar. */
type AvatarProps = {
  className?: string;
  name: string;
};

/**
 * Circular account badge showing the given name and surname initials.
 *
 * The badge is decorative because the name it abbreviates is always rendered
 * beside it, so it is hidden from assistive technology instead of repeating
 * the same identity twice. A name with no letters falls back to a person icon.
 *
 * @param root0 - Properties that configure avatar.
 * @param root0.className - Optional classes merged with the component styles, typically the size.
 * @param root0.name - Full account name abbreviated by the badge.
 * @returns The rendered avatar.
 */
export function Avatar({ className, name }: AvatarProps): ReactNode {
  const initials = getInitials(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-primary text-primary-foreground font-display grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
        className,
      )}
    >
      {initials || <UserRound className="size-1/2" />}
    </span>
  );
}
