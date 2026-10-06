import { type AppLocale, defaultLocale, isLocale } from "@/i18n/config";

/**
 * Copy for the crash screen shown when the root layout itself fails to render.
 *
 * That screen replaces the whole document, so it renders outside the next-intl
 * provider and cannot read the message catalogs. These two strings are the only
 * ones that must survive without it, and they stay translated per locale.
 */
export const fallbackMessages: Record<
  AppLocale,
  { retry: string; title: string }
> = {
  en: { retry: "Try again", title: "Something knocked over the board." },
  it: { retry: "Riprova", title: "Qualcosa ha rovesciato il tavolo." },
};

/**
 * Reads the preferred locale from a cookie header without any request context.
 *
 * @param cookie - Value of `document.cookie`, which may be empty or malformed.
 * @returns The preferred locale, or the default one when none is recorded.
 */
export function getFallbackLocale(cookie: string): AppLocale {
  const preference = /(?:^|;\s*)locale=([^;]*)/.exec(cookie)?.[1];
  return isLocale(preference) ? preference : defaultLocale;
}
