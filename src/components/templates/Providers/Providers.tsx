"use client";

import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";

import type { AppTheme } from "@/core";
import { isAppTheme, persistThemeCookie } from "@/utils/theme";

type ProvidersProps = {
  children: React.ReactNode;
  initialTheme?: AppTheme | undefined;
  nonce: string | undefined;
};

/**
 * Client-side application providers.
 *
 * @param root0 - Component or function properties.
 * @param root0.children - The 'children' property.
 * @param root0.initialTheme - The 'initialTheme' property.
 * @param root0.nonce - The request nonce that authorizes the theme script.
 * @returns The documented function result.
 */
export function Providers({
  children,
  initialTheme,
  nonce,
}: ProvidersProps): ReactNode {
  return (
    <ThemeProvider
      {...(nonce ? { nonce } : {})}
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
function ThemeCookieSync(): ReactNode {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (isAppTheme(resolvedTheme)) persistThemeCookie(resolvedTheme);
  }, [resolvedTheme]);

  return null;
}
