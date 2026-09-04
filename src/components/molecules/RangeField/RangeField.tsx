"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ReactNode } from "react";

import type { NumberRange } from "@/core";
import { clampRange } from "@/utils/libraryFilters";

/** Bounded range control backed by a dual-thumb slider and two numeric inputs. */
type RangeFieldProps = {
  bounds: NumberRange;
  maximumLabel: string;
  minimumLabel: string;
  onValueChange: (value: NumberRange) => void;
  step: number;
  summary: string;
  value: NumberRange;
};

/**
 * Selects an inclusive numeric range with a two-thumb slider and paired inputs.
 *
 * Every proposed value is clamped into the supplied bounds and reordered so the
 * lower endpoint can never overtake the upper one, whichever control changed it.
 * Each entry field selects its content on focus so a typed value replaces the
 * current one, and a partial entry is ignored until it parses as a number.
 *
 * @param root0 - Properties that configure range field.
 * @param root0.bounds - Inclusive lowest and highest values the control offers.
 * @param root0.maximumLabel - Accessible name for the upper thumb and input.
 * @param root0.minimumLabel - Accessible name for the lower thumb and input.
 * @param root0.onValueChange - Callback invoked with the next clamped range.
 * @param root0.step - Increment applied by the slider and the numeric inputs.
 * @param root0.summary - Localized description of the currently selected range.
 * @param root0.value - Currently selected inclusive range.
 * @returns The rendered range field.
 */
export function RangeField({
  bounds,
  maximumLabel,
  minimumLabel,
  onValueChange,
  step,
  summary,
  value,
}: RangeFieldProps): ReactNode {
  /**
   * Applies one edited endpoint while ignoring an incomplete numeric entry.
   *
   * @param endpoint - Range endpoint the numeric input controls.
   * @param entry - Raw text currently held by the numeric input.
   * @returns Nothing.
   */
  function commitEndpoint(endpoint: "max" | "min", entry: string): void {
    const parsed = Number(entry);
    if (entry.trim() === "" || !Number.isFinite(parsed)) return;
    onValueChange(clampRange({ ...value, [endpoint]: parsed }, bounds));
  }

  return (
    <div className="bg-background rounded-lg border px-3 py-2.5 shadow-sm">
      <p className="text-muted-foreground mb-2 text-xs font-semibold">
        {summary}
      </p>
      <SliderPrimitive.Root
        className="relative flex h-5 w-full touch-none items-center select-none"
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
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="sr-only">{minimumLabel}</span>
          <input
            className="bg-muted/50 h-8 w-full rounded-md px-2 text-sm font-semibold tabular-nums"
            inputMode="numeric"
            onChange={(event) => commitEndpoint("min", event.target.value)}
            onFocus={(event) => event.target.select()}
            type="text"
            value={value.min}
          />
        </label>
        <label className="block">
          <span className="sr-only">{maximumLabel}</span>
          <input
            className="bg-muted/50 h-8 w-full rounded-md px-2 text-sm font-semibold tabular-nums"
            inputMode="numeric"
            onChange={(event) => commitEndpoint("max", event.target.value)}
            onFocus={(event) => event.target.select()}
            type="text"
            value={value.max}
          />
        </label>
      </div>
    </div>
  );
}
