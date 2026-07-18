import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { Providers } from "@/components/providers";
import { isAppTheme } from "@/lib/theme";

import "./globals.css";

/** Global metadata for search engines and browser integrations. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:12500",
    ),
    title: {
      default: "Board Games Tracker",
      template: "%s · Board Games Tracker",
    },
    description: t("app.description"),
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
  const locale = await getLocale();
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
        <NextIntlClientProvider>
          <Providers initialTheme={theme}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
