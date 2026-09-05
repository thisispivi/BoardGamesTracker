"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import type { SelectOption } from "@/core";
import { cn } from "@/utils/cn";

/** Properties that configure the accessible select primitive. */
type SelectProps = {
  ariaLabel: string;
  className?: string;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  value?: string;
};

/**
 * Animated, theme-aware select control backed by Radix primitives.
 *
 * @param root0 - Properties that configure select.
 * @param root0.ariaLabel - Accessible name announced for the control.
 * @param root0.className - Optional classes merged with the component styles.
 * @param root0.defaultValue - Initial value shown before the user changes the selection.
 * @param root0.name - Form field name submitted with the selected value.
 * @param root0.onValueChange - Callback invoked with the next selected value or values.
 * @param root0.options - Selectable values displayed by the control.
 * @param root0.value - Selected value when the caller controls the component.
 * @returns The rendered select.
 */
export function Select({
  ariaLabel,
  className,
  defaultValue,
  name,
  onValueChange,
  options,
  value,
}: SelectProps): ReactNode {
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
          "bg-background hover:bg-muted/70 focus-visible:border-primary/50 data-[state=open]:border-primary/50 data-[state=open]:ring-primary/15 flex h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 text-sm font-medium shadow-sm transition-colors data-[state=open]:ring-4",
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
          className="select-content bg-card z-110 max-h-[min(19rem,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border p-1.5 shadow-2xl"
          collisionPadding={12}
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport className="filter-options max-h-72 space-y-1 overflow-y-auto overscroll-contain pr-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                className="select-item data-[state=checked]:bg-primary/10 data-[state=checked]:text-foreground relative flex cursor-pointer items-center rounded-lg py-2.5 pr-10 pl-3 text-sm font-semibold transition-colors outline-none select-none"
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="select-item-indicator text-primary absolute right-3">
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
