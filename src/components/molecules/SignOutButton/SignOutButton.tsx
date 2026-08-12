"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { authClient } from "@/utils/authClient";

/**
 * Revokes the current session from the account area.
 *
 * @returns The rendered sign out button.
 */
export function SignOutButton(): ReactNode {
  const router = useRouter();
  const t = useTranslations();

  /**
   * Revokes the browser session and returns to the public entry page.
   *
   * @returns A promise that resolves after navigation is refreshed.
   */
  async function signOut(): Promise<void> {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="text-muted-foreground hover:bg-danger/10 hover:text-danger mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
      onClick={signOut}
      type="button"
    >
      <LogOut className="size-4.5" />
      {t("navigation.logout")}
    </button>
  );
}
