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
          "bg-background hover:bg-muted/60 focus:ring-primary/25 flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 text-sm font-medium shadow-sm transition focus:ring-4 focus:outline-none",
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
          className="select-content bg-card z-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border p-1.5 shadow-2xl"
        >
          <SelectPrimitive.Viewport className="space-y-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="data-highlighted:bg-primary data-highlighted:text-primary-foreground relative flex cursor-pointer items-center rounded-lg py-2.5 pr-9 pl-3 text-sm font-medium transition outline-none select-none"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3">
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
