"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { CircleFlag } from "react-circle-flags";

import { Select } from "@/components/atoms/Select/Select";
import { isLocale } from "@/i18n/config";
import { setLocaleAction } from "@/server/actions/preferences";
import { cn } from "@/utils/cn";

/** Supported languages with the flag that identifies each one. */
const localeOptions = [
  { locale: "en", country: "gb", label: "English" },
  { locale: "it", country: "it", label: "Italiano" },
] as const;

/** Properties that initialize the account locale selector. */
type LocaleSelectControlProps = {
  className?: string;
  initialLocale: Locale;
};

/**
 * Immediately persists language changes picked from a dropdown.
 *
 * The dropdown scales to any number of supported locales and its portalled
 * panel is stacked above the mobile navigation drawer, so the same control
 * serves the sidebar, the signed-out header, and the drawer.
 *
 * @param root0 - Properties that configure locale select control.
 * @param root0.className - Optional classes merged with the control wrapper.
 * @param root0.initialLocale - Locale stored for the current user.
 * @returns The rendered locale select control.
 */
export function LocaleSelectControl({
  className,
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
    <div aria-busy={pending} className={cn("min-w-0 flex-1", className)}>
      <Select
        ariaLabel={t("locale.language")}
        onValueChange={changeLocale}
        options={localeOptions.map((option) => ({
          value: option.locale,
          label: (
            <span className="flex items-center gap-2.5">
              <CircleFlag
                alt=""
                className="size-5 shrink-0"
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
