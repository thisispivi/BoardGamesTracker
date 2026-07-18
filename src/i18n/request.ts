import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, type AppLocale } from "@/i18n/config";
import type englishMessages from "../../messages/en.json";

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
    // Keep server output and client hydration deterministic. A future account
    // time-zone preference can replace the deployment time zone here.
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
});
