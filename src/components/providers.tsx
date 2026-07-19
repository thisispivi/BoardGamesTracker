"use client";

import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Toaster } from "sonner";

import { type AppTheme, isAppTheme, persistThemeCookie } from "@/lib/theme";

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
      disableTransitionOnChange
      enableSystem
    >
      <ThemeCookieSync />
      {children}
      <Toaster position="bottom-right" richColors />
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
