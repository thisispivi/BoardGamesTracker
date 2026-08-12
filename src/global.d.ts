import type { AppLocale } from "@/i18n/config";

import type messages from "../messages/en.json";

declare module "next-intl" {
  /** Build-time application configuration injected by Next.js. */
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
