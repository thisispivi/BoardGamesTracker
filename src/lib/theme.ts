export type AppTheme = "dark" | "light";

/** Narrows persisted theme values to the two explicitly supported modes. */
export function isAppTheme(value: string | undefined): value is AppTheme {
  return value === "dark" || value === "light";
}

/** Keeps the server-readable theme cookie aligned with next-themes storage. */
export function persistThemeCookie(theme: AppTheme): void {
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
