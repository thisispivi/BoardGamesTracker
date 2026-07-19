"use client";

import { Gift, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import { cn } from "@/lib/utils";

/** Coupled gifted and price controls that always submit a consistent value pair. */
export function GiftedPriceField({
  currency,
  className,
  companionField,
  defaultGifted = false,
  defaultValue = 0,
}: {
  currency: string;
  className?: string;
  companionField?: React.ReactNode;
  defaultGifted?: boolean;
  defaultValue?: number;
}) {
  const [gifted, setGifted] = useState(defaultGifted);
  const giftedId = useId();
  const t = useTranslations();

  return (
    <fieldset className={cn("space-y-4", className)}>
      <legend className="sr-only">{t("game.giftedLong")}</legend>
      <div className={cn("grid gap-4", companionField && "grid-cols-2")}>
        <label className="text-sm font-bold">
          <span className="mb-2 block">{t("edit.money", { currency })}</span>
          {gifted ? (
            <>
              <input name="moneySpent" type="hidden" value="0" />
              <span className="field-input bg-muted/45 text-muted-foreground flex items-center gap-2">
                <Gift aria-hidden="true" className="text-primary size-4" />
                {t("game.markGiftedShort")}
              </span>
            </>
          ) : (
            <input
              className="field-input"
              defaultValue={defaultValue}
              max={999_999_999.99}
              min={0}
              name="moneySpent"
              required
              step="0.01"
              type="number"
            />
          )}
        </label>
        {companionField}
      </div>
      <div className="bg-muted/65 hover:bg-muted flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm font-bold transition">
        <div className="flex min-w-0 items-center gap-2">
          <label
            className="flex cursor-pointer items-center gap-2"
            htmlFor={giftedId}
          >
            <Gift aria-hidden="true" className="text-primary size-4 shrink-0" />
            <span>{t("game.giftedLong")}</span>
          </label>
          <Tooltip content={t("game.giftedHelp")}>
            <button
              aria-label={t("game.giftedHelp")}
              className="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-primary/30 grid size-7 shrink-0 place-items-center rounded-lg transition focus-visible:ring-4 focus-visible:outline-none"
              type="button"
            >
              <Info aria-hidden="true" className="size-4" />
            </button>
          </Tooltip>
        </div>
        <input
          checked={gifted}
          className="accent-primary size-4 shrink-0"
          id={giftedId}
          name="gifted"
          onChange={(event) => setGifted(event.target.checked)}
          type="checkbox"
          value="true"
        />
      </div>
    </fieldset>
  );
}
