"use client";

import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";

import type { AppTheme } from "@/core";
import { isAppTheme, persistThemeCookie } from "@/utils/theme";

/** Initial theme and application content supplied to client providers. */
type ProvidersProps = {
  children: React.ReactNode;
  initialTheme?: AppTheme | undefined;
  nonce: string | undefined;
};

/**
 * Client-side application providers.
 *
 * @param root0 - Properties that configure providers.
 * @param root0.children - Content rendered inside the component.
 * @param root0.initialTheme - Theme resolved on the server for the first render.
 * @param root0.nonce - The request nonce that authorizes the theme script.
 * @returns The rendered providers.
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

/**
 * Migrates the resolved next-themes value into the SSR-readable cookie.
 *
 * @returns No visible output; the component only synchronizes theme state.
 */
function ThemeCookieSync(): ReactNode {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (isAppTheme(resolvedTheme)) persistThemeCookie(resolvedTheme);
  }, [resolvedTheme]);

  return null;
}
