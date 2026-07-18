import "server-only";

import { cookies } from "next/headers";
import { messages } from "@/lib/messages";

/** Supported application locale identifiers. */
const locales = ["en", "it"] as const;
/** Supported application locale. */
export type Locale = (typeof locales)[number];
/** Default application locale. */
export const defaultLocale: Locale = "en";

/** Determines whether an arbitrary value is a supported locale. */
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** Reads the current locale from its same-site preference cookie. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value && isLocale(value) ? value : defaultLocale;
}

/** Returns the compact server-side translation dictionary. */
export async function getDictionary() {
  return messages[await getLocale()];
}
