"use client";

import { Gift, Info } from "lucide-react";
import { useId, useState } from "react";

import { useTranslations } from "next-intl";
import { Tooltip } from "@/components/ui/tooltip";
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
              <input type="hidden" name="moneySpent" value="0" />
              <span className="field-input bg-muted/45 text-muted-foreground flex items-center gap-2">
                <Gift className="text-primary size-4" aria-hidden="true" />
                {t("game.markGiftedShort")}
              </span>
            </>
          ) : (
            <input
              name="moneySpent"
              type="number"
              min={0}
              max={999_999_999.99}
              step="0.01"
              defaultValue={defaultValue}
              required
              className="field-input"
            />
          )}
        </label>
        {companionField}
      </div>
      <div className="bg-muted/65 hover:bg-muted flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm font-bold transition">
        <div className="flex min-w-0 items-center gap-2">
          <label
            htmlFor={giftedId}
            className="flex cursor-pointer items-center gap-2"
          >
            <Gift className="text-primary size-4 shrink-0" aria-hidden="true" />
            <span>{t("game.giftedLong")}</span>
          </label>
          <Tooltip content={t("game.giftedHelp")}>
            <button
              type="button"
              className="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-primary/30 grid size-7 shrink-0 place-items-center rounded-lg transition focus-visible:ring-4 focus-visible:outline-none"
              aria-label={t("game.giftedHelp")}
            >
              <Info className="size-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        <input
          id={giftedId}
          name="gifted"
          type="checkbox"
          value="true"
          checked={gifted}
          onChange={(event) => setGifted(event.target.checked)}
          className="accent-primary size-4 shrink-0"
        />
      </div>
    </fieldset>
  );
}
