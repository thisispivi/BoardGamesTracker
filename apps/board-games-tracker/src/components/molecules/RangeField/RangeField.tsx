"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ReactNode } from "react";

import type { NumberRange } from "@/core";
import { clampRange } from "@/utils/libraryFilters";

/** Bounded range control backed by a dual-thumb slider and two numeric entries. */
type RangeFieldProps = {
  bounds: NumberRange;
  maximumLabel: string;
  minimumLabel: string;
  onValueChange: (value: NumberRange) => void;
  step: number;
  unit?: string;
  value: NumberRange;
};

/**
 * Selects an inclusive numeric range with a two-thumb slider and paired entries.
 *
 * Every proposed value is clamped into the supplied bounds and reordered, so
 * the lower endpoint can never overtake the upper one whichever control moved.
 * A half-typed entry is ignored until it parses as a number.
 *
 * @param root0 - Properties that configure range field.
 * @param root0.bounds - Inclusive lowest and highest values the control offers.
 * @param root0.maximumLabel - Accessible name for the upper thumb and entry.
 * @param root0.minimumLabel - Accessible name for the lower thumb and entry.
 * @param root0.onValueChange - Callback invoked with the next clamped range.
 * @param root0.step - Increment applied by the slider and the numeric entries.
 * @param root0.unit - Localized unit suffix shown inside both entries.
 * @param root0.value - Currently selected inclusive range.
 * @returns The rendered range field.
 */
export function RangeField({
  bounds,
  maximumLabel,
  minimumLabel,
  onValueChange,
  step,
  unit,
  value,
}: RangeFieldProps): ReactNode {
  /**
   * Applies one edited endpoint while ignoring an incomplete numeric entry.
   *
   * @param endpoint - Range endpoint the numeric entry controls.
   * @param entry - Raw text currently held by the numeric entry.
   * @returns Nothing.
   */
  function commitEndpoint(endpoint: "max" | "min", entry: string): void {
    const parsed = Number(entry);
    if (entry.trim() === "" || !Number.isFinite(parsed)) return;
    onValueChange(clampRange({ ...value, [endpoint]: parsed }, bounds));
  }

  return (
    <div className="flex h-11 items-center gap-2">
      <RangeEntry
        label={minimumLabel}
        onCommit={(entry) => commitEndpoint("min", entry)}
        {...(unit === undefined ? {} : { unit })}
        value={value.min}
      />
      <SliderPrimitive.Root
        className="relative flex h-11 min-w-0 flex-1 touch-none items-center select-none"
        max={bounds.max}
        min={bounds.min}
        minStepsBetweenThumbs={0}
        onValueChange={([min, max]) =>
          onValueChange(
            clampRange(
              { max: max ?? value.max, min: min ?? value.min },
              bounds,
            ),
          )
        }
        step={step}
        value={[value.min, value.max]}
      >
        <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow rounded-full">
          <SliderPrimitive.Range className="bg-primary absolute h-full rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={minimumLabel}
          className="border-primary bg-background focus-visible:outline-primary block size-4 rounded-full border-2 shadow transition focus-visible:outline-2"
        />
        <SliderPrimitive.Thumb
          aria-label={maximumLabel}
          className="border-primary bg-background focus-visible:outline-primary block size-4 rounded-full border-2 shadow transition focus-visible:outline-2"
        />
      </SliderPrimitive.Root>
      <RangeEntry
        label={maximumLabel}
        onCommit={(entry) => commitEndpoint("max", entry)}
        {...(unit === undefined ? {} : { unit })}
        value={value.max}
      />
    </div>
  );
}

/** One labelled range endpoint entry with an optional unit suffix. */
type RangeEntryProps = {
  label: string;
  onCommit: (entry: string) => void;
  unit?: string;
  value: number;
};

/**
 * Renders one range endpoint as a compact entry field carrying its unit.
 *
 * The unit is decorative: the accessible name supplied by the caller already
 * states it, so repeating it would double the announcement.
 *
 * @param root0 - Properties that configure range entry.
 * @param root0.label - Accessible name announced for the endpoint.
 * @param root0.onCommit - Callback invoked with the raw text of every edit.
 * @param root0.unit - Localized unit suffix displayed after the value.
 * @param root0.value - Endpoint currently selected for this side of the range.
 * @returns The rendered endpoint entry.
 */
function RangeEntry({
  label,
  onCommit,
  unit,
  value,
}: RangeEntryProps): ReactNode {
  return (
    <label className="bg-background focus-within:border-primary/50 flex h-11 w-20 shrink-0 items-center gap-1 rounded-lg border px-2 shadow-sm transition-colors">
      <span className="sr-only">{label}</span>
      <input
        className="w-full min-w-0 bg-transparent text-sm font-semibold tabular-nums outline-none"
        inputMode="numeric"
        onChange={(event) => onCommit(event.target.value)}
        onFocus={(event) => event.target.select()}
        type="text"
        value={value}
      />
      {unit ? (
        <span
          aria-hidden="true"
          className="text-muted-foreground shrink-0 text-xs"
        >
          {unit}
        </span>
      ) : null}
    </label>
  );
}
