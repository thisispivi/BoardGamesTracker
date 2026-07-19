"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import type { MultiSelectOption } from "@/core";
import { cn } from "@/utils/cn";

type MultiSelectProps = {
  ariaLabel: string;
  className?: string;
  clearLabel: string;
  emptyLabel: string;
  onValueChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  selectedSummary: string;
  values: string[];
};

/** Searchable, animated multi-select popover with a bounded scrollable option list. */
export function MultiSelect({
  ariaLabel,
  className,
  clearLabel,
  emptyLabel,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  selectedSummary,
  values,
}: MultiSelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(values), [values]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) =>
            option.label.toLocaleLowerCase().includes(normalizedQuery),
          )
        : options,
    [normalizedQuery, options],
  );
  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (options.find((option) => option.value === values[0])?.label ??
          selectedSummary)
        : selectedSummary;

  /** Toggles one facet while preserving the order of the available options. */
  function toggleValue(value: string) {
    const next = new Set(values);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onValueChange(
      options
        .filter((option) => next.has(option.value))
        .map((option) => option.value),
    );
  }

  return (
    <Popover.Root
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
      open={open}
    >
      <Popover.Trigger asChild>
        <button
          aria-label={ariaLabel}
          className={cn(
            "bg-background hover:bg-muted/60 focus:ring-primary/25 flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 text-sm font-medium shadow-sm transition focus:ring-4 focus:outline-none",
            className,
          )}
          type="button"
        >
          <span
            className={cn(
              "truncate",
              values.length === 0 && "text-muted-foreground",
            )}
          >
            {triggerLabel}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {values.length > 0 ? (
              <span className="bg-primary text-primary-foreground min-w-5 rounded-full px-1.5 py-0.5 text-center text-[0.65rem] font-bold tabular-nums">
                {values.length}
              </span>
            ) : null}
            <ChevronDown className="text-muted-foreground size-4 transition-transform duration-200 in-data-[state=open]:rotate-180" />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="popover-content bg-card z-80 w-(--radix-popover-trigger-width) max-w-[calc(100vw-1.5rem)] min-w-64 overflow-hidden rounded-xl border shadow-2xl"
          collisionPadding={12}
          sideOffset={8}
        >
          <div className="border-b p-2">
            <label className="relative block">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                className="bg-muted/60 focus:ring-primary/20 h-10 w-full rounded-lg pr-3 pl-9 text-sm focus:ring-4 focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                type="search"
                value={query}
              />
            </label>
          </div>
          <div
            aria-label={ariaLabel}
            aria-multiselectable="true"
            className="filter-options max-h-72 space-y-1 overflow-y-auto overscroll-contain p-1.5"
            role="listbox"
          >
            {visibleOptions.length === 0 ? (
              <p className="text-muted-foreground px-3 py-8 text-center text-sm">
                {emptyLabel}
              </p>
            ) : (
              visibleOptions.map((option) => {
                const checked = selected.has(option.value);
                return (
                  <button
                    aria-selected={checked}
                    className="hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition outline-none"
                    key={option.value}
                    onClick={() => toggleValue(option.value)}
                    role="option"
                    type="button"
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      {checked ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {option.count !== undefined ? (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {option.count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {values.length > 0 ? (
            <div className="border-t p-1.5">
              <button
                className="text-muted-foreground hover:bg-muted flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition"
                onClick={() => onValueChange([])}
                type="button"
              >
                <X className="size-3.5" />
                {clearLabel}
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
