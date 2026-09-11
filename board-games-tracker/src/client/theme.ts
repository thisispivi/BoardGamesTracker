"use client";

import type { AppTheme } from "@/core";

/**
 * Keeps the server-readable theme cookie aligned with next-themes storage.
 *
 * @param theme - Application theme persisted for future requests.
 * @returns Nothing.
 */
export function persistThemeCookie(theme: AppTheme): void {
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
