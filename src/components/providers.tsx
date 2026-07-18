"use client";

import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useEffect } from "react";

import { isAppTheme, persistThemeCookie, type AppTheme } from "@/lib/theme";

/** Client-side application providers. */
export function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: AppTheme | undefined;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme ?? "system"}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeCookieSync />
      {children}
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}

/** Migrates the resolved next-themes value into the SSR-readable cookie. */
function ThemeCookieSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (isAppTheme(resolvedTheme)) persistThemeCookie(resolvedTheme);
  }, [resolvedTheme]);

  return null;
}
