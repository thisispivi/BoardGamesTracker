"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { CircleFlag } from "react-circle-flags";

import { isLocale } from "@/i18n/config";
import { setLocaleAction } from "@/server/actions/preferences";
import { cn } from "@/utils/cn";

/** Supported languages with the flag that identifies each one. */
const localeOptions = [
  { locale: "en" as const, country: "gb", label: "English" },
  { locale: "it" as const, country: "it", label: "Italiano" },
];

/** Properties that initialize the account locale selector. */
type LocaleSelectControlProps = {
  initialLocale: Locale;
};

/**
 * Immediately persists language changes from a segmented flag control.
 *
 * The languages are laid out side by side rather than inside a dropdown so the
 * control keeps working inside the mobile navigation drawer, where a portalled
 * popover would land outside the modal and stop receiving pointer events.
 *
 * @param root0 - Properties that configure locale select control.
 * @param root0.initialLocale - Locale stored for the current user.
 * @returns The rendered locale select control.
 */
export function LocaleSelectControl({
  initialLocale,
}: LocaleSelectControlProps): ReactNode {
  const [locale, setLocale] = useState(initialLocale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  /**
   * Persists a supported locale and refreshes translated server content.
   *
   * @param value - Application locale selected by the user.
   * @returns Nothing.
   */
  function changeLocale(value: string): void {
    if (!isLocale(value) || value === locale) return;
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
      aria-label={t("locale.language")}
      className="flex min-w-0 flex-1 items-center gap-1"
      role="group"
    >
      {localeOptions.map((option) => (
        <button
          aria-pressed={option.locale === locale}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-bold transition",
            option.locale === locale
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          key={option.locale}
          onClick={() => changeLocale(option.locale)}
          type="button"
        >
          <CircleFlag
            alt=""
            className="size-4.5 shrink-0"
            countryCode={option.country}
          />
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
