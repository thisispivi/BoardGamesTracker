"use client";

import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CircleFlag } from "react-circle-flags";

import { Select } from "@/components/atoms/Select/Select";

/** Supported languages with the flag that identifies each one. */
const localeOptions = [
  { locale: "en", country: "gb", label: "English" },
  { locale: "it", country: "it", label: "Italiano" },
] as const;

/** Current language and the caller's preference update handler. */
type LocalePickerProps = {
  locale: Locale;
  onValueChange: (value: string) => void;
};

/**
 * Renders the same flagged language dropdown for account and demo preferences.
 *
 * @param root0 - Current language and preference callback.
 * @param root0.locale - Selected supported language.
 * @param root0.onValueChange - Handler that persists or locally applies the selection.
 * @returns The shared accessible language dropdown.
 */
export function LocalePicker({
  locale,
  onValueChange,
}: LocalePickerProps): ReactNode {
  const t = useTranslations();
  return (
    <Select
      ariaLabel={t("locale.language")}
      onValueChange={onValueChange}
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
  );
}
