"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { CircleFlag } from "react-circle-flags";

import { Select } from "@/components/ui/select";
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
  const t = useTranslations();

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
      aria-busy={pending}
      className="text-muted-foreground flex min-w-0 items-center gap-1 text-sm"
    >
      <Languages aria-hidden="true" className="size-4 shrink-0" />
      <Select
        ariaLabel={t("locale.language")}
        className="h-9 min-w-32 border-0 bg-transparent px-2 shadow-none"
        onValueChange={changeLocale}
        options={localeOptions.map((option) => ({
          value: option.locale,
          label: (
            <span className="flex items-center gap-2">
              <CircleFlag
                alt=""
                className="size-5"
                countryCode={option.country}
              />
              <span>{option.label}</span>
            </span>
          ),
        }))}
        value={locale}
      />
    </div>
  );
}
