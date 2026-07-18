"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Select } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { currencies, getCurrencySymbol, type Currency } from "@/lib/currency";
import { setCurrencyAction } from "@/server/actions/preferences";

/** Immediately saves a supported ISO currency preference. */
export function CurrencySelect({
  initialCurrency,
}: {
  initialCurrency: string;
}) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  function changeCurrency(value: string): void {
    if (!currencies.includes(value as Currency)) return;
    setCurrency(value);
    const formData = new FormData();
    formData.set("currency", value);
    startTransition(async () => {
      await setCurrencyAction(formData);
      router.refresh();
      toast.success(t("currency.updated"));
    });
  }

  return (
    <div className="w-full sm:max-w-sm" aria-busy={pending}>
      <Select
        ariaLabel={t("settings.currency")}
        value={currency}
        onValueChange={changeCurrency}
        options={currencies.map((value) => ({
          value,
          label: (
            <span className="flex items-center gap-3">
              <span className="select-option-mark bg-primary/10 text-primary grid size-7 place-items-center rounded-lg text-xs font-black">
                {getCurrencySymbol(value)}
              </span>
              <span>{value}</span>
            </span>
          ),
        }))}
      />
    </div>
  );
}
