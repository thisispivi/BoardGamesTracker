import type messages from "@messages/en.json";

import type { AppLocale } from "@/core";

declare module "next-intl" {
  /** Build-time application configuration injected by Next.js. */
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
