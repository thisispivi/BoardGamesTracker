import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:brightness-110",
        secondary: "border bg-card text-card-foreground hover:bg-muted",
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

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

/**
 * Reusable button primitive with product variants.
 *
 * @param root0 - Component or function properties.
 * @param root0.className - The 'className' property.
 * @param root0.variant - The 'variant' property.
 * @param root0.size - The 'size' property.
 * @returns The documented function result.
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

/** Returns variant classes for link-styled buttons. */
export { buttonVariants };
