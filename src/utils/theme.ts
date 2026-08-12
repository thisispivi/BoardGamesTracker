import type { AppTheme } from "@/core";

/**
 * Narrows persisted theme values to the two explicitly supported modes.
 *
 * @param value - Untrusted input being validated or normalized.
 * @returns Whether the value is a supported application theme.
 */
export function isAppTheme(value: string | undefined): value is AppTheme {
  return value === "dark" || value === "light";
}

/**
 * Keeps the server-readable theme cookie aligned with next-themes storage.
 *
 * @param theme - Application theme persisted for future requests.
 * @returns Nothing.
 */
export function persistThemeCookie(theme: AppTheme): void {
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
