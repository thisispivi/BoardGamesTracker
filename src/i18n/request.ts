import type englishMessages from "@messages/en.json";
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { type AppLocale, defaultLocale, isLocale } from "@/i18n/config";

/** Message catalog shape established by the canonical English catalog. */
type Messages = typeof englishMessages;

const messageLoaders: Record<AppLocale, () => Promise<{ default: Messages }>> =
  {
    en: () => import("@messages/en.json"),
    it: () => import("@messages/it.json"),
  };

/**
 * Builds the locale configuration shared by server and client components.
 *
 * An explicit locale passed to an awaitable next-intl function wins over the
 * preference cookie, so background work such as email rendering can select a
 * language that is not the one of the current request.
 */
export default getRequestConfig(async ({ locale: requested }) => {
  if (isLocale(requested)) {
    return {
      locale: requested,
      messages: (await messageLoaders[requested]()).default,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const preference = (await cookies()).get("locale")?.value;
  const locale = isLocale(preference) ? preference : defaultLocale;

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
});
