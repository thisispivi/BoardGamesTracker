"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/atoms/Button/Button";
import { persistThemeCookie } from "@/utils/theme";

/** Toggles the persisted light and dark color schemes. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();

  function toggleTheme(): void {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    persistThemeCookie(nextTheme);
    setTheme(nextTheme);
  }

  return (
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
  );
}
