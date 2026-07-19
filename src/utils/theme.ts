import type { AppTheme } from "@/core";

/**
 * Narrows persisted theme values to the two explicitly supported modes.
 *
 * @param value - The value to inspect or transform.
 * @returns The documented function result.
 */
export function isAppTheme(value: string | undefined): value is AppTheme {
  return value === "dark" || value === "light";
}

/**
 * Keeps the server-readable theme cookie aligned with next-themes storage.
 *
 * @param theme - The 'theme' value.
 * @returns The documented function result.
 */
export function persistThemeCookie(theme: AppTheme): void {
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
