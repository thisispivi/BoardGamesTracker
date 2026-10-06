import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Defines the reusable visual variants shared by buttons and button-like links. */
export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110",
        secondary:
          "border bg-card text-card-foreground hover:bg-muted hover:border-accent/50",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-danger text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/** Native and product-specific properties accepted by the button primitive. */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

/**
 * Reusable button primitive with product variants.
 *
 * @param root0 - Properties that configure button.
 * @param root0.className - Optional classes merged with the component styles.
 * @param root0.variant - Product color variant applied to the control.
 * @param root0.size - Product size variant applied to the control.
 * @returns The rendered button.
 */
export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
