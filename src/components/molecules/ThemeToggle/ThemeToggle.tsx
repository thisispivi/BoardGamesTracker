"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

import { persistThemeCookie } from "@/client/theme";
import { Button } from "@/components/atoms/Button/Button";
import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";

/**
 * Toggles the persisted light and dark color schemes.
 *
 * @returns The rendered theme toggle.
 */
export function ThemeToggle(): ReactNode {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();

  /**
   * Switches between light and dark themes and persists the selection.
   *
   * @returns Nothing.
   */
  function toggleTheme(): void {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    persistThemeCookie(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <Tooltip content={t("theme.toggle")}>
      <Button
        aria-label={t("theme.toggle")}
        onClick={toggleTheme}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Sun className="hidden size-4 dark:block" />
        <Moon className="size-4 dark:hidden" />
      </Button>
    </Tooltip>
  );
}
