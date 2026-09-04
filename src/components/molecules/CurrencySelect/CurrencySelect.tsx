"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import { Select } from "@/components/atoms/Select/Select";
import { setCurrencyAction } from "@/server/actions/preferences";
import { currencies, getCurrencySymbol, isCurrency } from "@/utils/currency";

/** Properties that initialize the account currency selector. */
type CurrencySelectProps = {
  initialCurrency: string;
};

/**
 * Immediately saves a supported ISO currency preference.
 *
 * @param root0 - Properties that configure currency select.
 * @param root0.initialCurrency - Currency stored for the current user.
 * @returns The rendered currency select.
 */
export function CurrencySelect({
  initialCurrency,
}: CurrencySelectProps): ReactNode {
  const [currency, setCurrency] = useState(initialCurrency);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  /**
   * Persists a supported currency and refreshes server-rendered values.
   *
   * @param value - ISO currency code selected by the user.
   * @returns Nothing.
   */
  function changeCurrency(value: string): void {
    if (!isCurrency(value)) return;
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
    <div aria-busy={pending} className="w-full sm:max-w-sm">
      <Select
        ariaLabel={t("settings.currency")}
        onValueChange={changeCurrency}
        options={currencies.map((value) => ({
          value,
          label: (
            <span className="flex items-center gap-3">
              <span className="select-option-mark bg-primary/10 text-primary grid size-7 place-items-center rounded-md text-xs font-black">
                {getCurrencySymbol(value)}
              </span>
              <span>{value}</span>
            </span>
          ),
        }))}
        value={currency}
      />
    </div>
  );
}
