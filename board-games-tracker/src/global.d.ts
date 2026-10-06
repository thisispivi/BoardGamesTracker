import type messages from "@messages/en.json";

import type { AppLocale } from "@/i18n/config";

declare module "next-intl" {
  /** Build-time application configuration injected by Next.js. */
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
