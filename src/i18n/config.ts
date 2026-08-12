/** Locales supported by the application UI. */
const locales = ["en", "it"] as const;

/** Locale used when no valid preference cookie is present. */
export const defaultLocale = "en" as const;

/** Supported application locale. */
export type AppLocale = (typeof locales)[number];

/**
 * Narrows an arbitrary value to a supported locale.
 *
 * @param value - Untrusted input being validated or normalized.
 * @returns Whether the value is a supported application locale.
 */
export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && locales.includes(value as AppLocale);
}
