import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { Providers } from "@/components/providers";
import { I18nProvider } from "@/components/i18n-provider";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { messages } from "@/lib/messages";
import { getDictionary } from "@/lib/i18n";
import { translate } from "@/lib/messages";
import { isAppTheme } from "@/lib/theme";

import "./globals.css";

/** Global metadata for search engines and browser integrations. */
export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:12500",
    ),
    title: {
      default: "Board Games Tracker",
      template: "%s · Board Games Tracker",
    },
    description: translate(dictionary, "app.description"),
    applicationName: "Board Games Tracker",
    robots: { index: true, follow: true },
    icons: { icon: "/favicon.ico" },
  };
}

/** Theme-aware browser viewport configuration. */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ed" },
    { media: "(prefers-color-scheme: dark)", color: "#111511" },
  ],
};

/** Root document shell with locale, theme, and toast providers. */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale: Locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const cookieTheme = cookieStore.get("theme")?.value;
  const theme = isAppTheme(cookieTheme) ? cookieTheme : undefined;

  return (
    <html
      lang={locale}
      className={theme === "dark" ? "dark" : undefined}
      style={theme ? { colorScheme: theme } : undefined}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body>
        <I18nProvider dictionary={messages[locale]}>
          <Providers initialTheme={theme}>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
