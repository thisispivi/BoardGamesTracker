"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { persistThemeCookie } from "@/lib/theme";

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
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("theme.toggle")}
      onClick={toggleTheme}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
