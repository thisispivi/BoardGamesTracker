import { type AppLocale, localeSchema } from "@/core";

/** Locale used when no valid preference cookie is present. */
export const defaultLocale = "en" as const satisfies AppLocale;

/**
 * Narrows an arbitrary value to a supported locale.
 *
 * @param value - A locale read from a preference cookie or a caller argument.
 * @returns Whether the value is a supported application locale.
 */
export function isLocale(value: unknown): value is AppLocale {
  return localeSchema.safeParse(value).success;
}

/**
 * Reads the raw `locale` preference from a cookie header.
 *
 * @param cookie - A `Cookie` header or `document.cookie` value, possibly empty.
 * @returns The unvalidated cookie value, or undefined when it is absent. Pass
 * it through `isLocale` before use.
 */
export function readLocaleCookie(cookie: string): string | undefined {
  return /(?:^|;\s*)locale=([^;]*)/.exec(cookie)?.[1];
}
