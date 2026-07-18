"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleFlag } from "react-circle-flags";

import { Select } from "@/components/ui/select";
import type { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/i18n-provider";
import { setLocaleAction } from "@/server/actions/preferences";

const localeOptions = [
  { locale: "en" as const, country: "gb", label: "English" },
  { locale: "it" as const, country: "it", label: "Italiano" },
];

/** Immediately persists language changes and displays round inline flags. */
export function LocaleSelectControl({
  initialLocale,
}: {
  initialLocale: Locale;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useI18n();

  function changeLocale(value: string): void {
    if (value !== "en" && value !== "it") return;
    setLocale(value);
    const formData = new FormData();
    formData.set("locale", value);
    startTransition(async () => {
      await setLocaleAction(formData);
      router.refresh();
    });
  }

  return (
    <div
      className="text-muted-foreground flex min-w-0 items-center gap-1 text-sm"
      aria-busy={pending}
    >
      <Languages className="size-4 shrink-0" aria-hidden="true" />
      <Select
        value={locale}
        onValueChange={changeLocale}
        ariaLabel={t("locale.language")}
        className="h-9 min-w-32 border-0 bg-transparent px-2 shadow-none"
        options={localeOptions.map((option) => ({
          value: option.locale,
          label: (
            <span className="flex items-center gap-2">
              <CircleFlag
                countryCode={option.country}
                alt=""
                className="size-5"
              />
              <span>{option.label}</span>
            </span>
          ),
        }))}
      />
    </div>
  );
}
