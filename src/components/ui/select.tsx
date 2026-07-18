"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  label: React.ReactNode;
  value: string;
};

/** Animated, theme-aware select control backed by Radix primitives. */
export function Select({
  ariaLabel,
  className,
  defaultValue,
  name,
  onValueChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  value?: string;
}) {
  return (
    <SelectPrimitive.Root
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(name === undefined ? {} : { name })}
      {...(onValueChange === undefined ? {} : { onValueChange })}
      {...(value === undefined ? {} : { value })}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "bg-background hover:bg-muted/70 focus-visible:border-primary/50 focus-visible:ring-primary/20 data-[state=open]:border-primary/50 data-[state=open]:ring-primary/15 flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 text-sm font-medium shadow-sm transition-colors focus-visible:ring-4 focus-visible:outline-none data-[state=open]:ring-4",
          className,
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="text-muted-foreground size-4 transition-transform duration-200 in-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          collisionPadding={12}
          className="select-content bg-card z-80 max-h-[min(19rem,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) overflow-hidden rounded-2xl border p-1.5 shadow-2xl"
        >
          <SelectPrimitive.Viewport className="filter-options max-h-[18rem] space-y-1 overflow-y-auto overscroll-contain pr-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="data-highlighted:bg-muted data-highlighted:text-foreground data-[state=checked]:bg-primary/10 data-[state=checked]:text-foreground relative flex cursor-pointer items-center rounded-xl py-2.5 pr-10 pl-3 text-sm font-semibold transition-colors outline-none select-none"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="text-primary absolute right-3">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
