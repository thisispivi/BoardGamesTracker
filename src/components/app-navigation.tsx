"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  ChartNoAxesCombined,
  Dices,
  Heart,
  House,
  LogOut,
  Menu,
  Settings,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { useI18n } from "@/components/i18n-provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type NavigationLabels = {
  dashboard: string;
  collection: string;
  wishlist: string;
  stats: string;
  play: string;
  settings: string;
  admin: string;
  logout: string;
};

/** Active navigation, mobile drawer, and session sign-out. */
export function AppNavigation({
  labels,
  isAdmin,
  mobile = false,
  user,
}: {
  labels: NavigationLabels;
  isAdmin: boolean;
  mobile?: boolean;
  user?: { name: string; email: string };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useI18n();
  const links = [
    { href: "/dashboard", label: labels.dashboard, icon: House },
    { href: "/collection", label: labels.collection, icon: BookOpen },
    { href: "/wishlist", label: labels.wishlist, icon: Heart },
    { href: "/play", label: labels.play, icon: Dices },
    { href: "/stats", label: labels.stats, icon: ChartNoAxesCombined },
    { href: "/settings", label: labels.settings, icon: Settings },
    ...(isAdmin ? [{ href: "/admin", label: labels.admin, icon: Shield }] : []),
  ];

  const content = (
    <nav
      className={cn(
        "space-y-1",
        mobile ? "mt-4 min-h-0 flex-1 overflow-y-auto py-2 pr-1" : "mt-12",
      )}
      aria-label={t("nav.primary")}
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <link.icon className="size-4.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  if (!mobile) {
    return content;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("nav.open")}
          className="bg-card hover:bg-muted grid size-11 place-items-center rounded-xl border shadow-sm transition"
        >
          <Menu className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-100 bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="drawer-content bg-card fixed inset-y-3 right-3 z-101 flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border p-5 shadow-2xl focus:outline-none">
          <Dialog.Title className="sr-only">{t("nav.primary")}</Dialog.Title>
          <div className="flex shrink-0 items-center justify-between border-b pb-4">
            <Logo />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("nav.close")}
                className="hover:bg-muted grid size-10 place-items-center rounded-xl transition"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          {content}
          {user && (
            <div className="mt-5 shrink-0 border-t pt-5">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-primary-foreground grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </p>
                </div>
              </div>
              <SignOutButton label={labels.logout} />
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Revokes the current session from the account area. */
export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();

  async function signOut(): Promise<void> {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-muted-foreground hover:bg-danger/10 hover:text-danger mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
    >
      <LogOut className="size-4.5" />
      {label}
    </button>
  );
}
