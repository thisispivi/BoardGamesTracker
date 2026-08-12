import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { type AppLocale, defaultLocale, isLocale } from "@/i18n/config";

import type englishMessages from "../../messages/en.json";

/** Message catalog shape established by the canonical English catalog. */
type Messages = typeof englishMessages;

const messageLoaders: Record<AppLocale, () => Promise<{ default: Messages }>> =
  {
    en: () => import("../../messages/en.json"),
    it: () => import("../../messages/it.json"),
  };

/** Builds the locale configuration shared by server and client components. */
export default getRequestConfig(async () => {
  const preference = (await cookies()).get("locale")?.value;
  const locale = isLocale(preference) ? preference : defaultLocale;

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
});
