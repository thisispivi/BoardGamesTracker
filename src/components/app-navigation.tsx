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
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { AppSpinner } from "@/components/ui/app-spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Active navigation, mobile drawer, and session sign-out. */
export function AppNavigation({
  isAdmin,
  mobile = false,
  user,
}: {
  isAdmin: boolean;
  mobile?: boolean;
  user?: { name: string; email: string };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const links = [
    { href: "/dashboard", label: t("navigation.dashboard"), icon: House },
    { href: "/collection", label: t("navigation.collection"), icon: BookOpen },
    { href: "/wishlist", label: t("navigation.wishlist"), icon: Heart },
    { href: "/play", label: t("navigation.play"), icon: Dices },
    { href: "/stats", label: t("navigation.stats"), icon: ChartNoAxesCombined },
    { href: "/settings", label: t("navigation.settings"), icon: Settings },
    ...(isAdmin
      ? [{ href: "/admin", label: t("navigation.admin"), icon: Shield }]
      : []),
  ];

  const content = (
    <nav
      aria-label={t("nav.primary")}
      className={cn(
        "space-y-1",
        mobile ? "mt-4 min-h-0 flex-1 overflow-y-auto py-2 pr-1" : "mt-12",
      )}
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href={link.href}
            key={link.href}
            onClick={() => setOpen(false)}
          >
            <link.icon className="size-4.5" />
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            <NavigationPendingIndicator />
          </Link>
        );
      })}
    </nav>
  );

  if (!mobile) {
    return content;
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <button
          aria-label={t("nav.open")}
          className="bg-card hover:bg-muted grid size-11 place-items-center rounded-xl border shadow-sm transition"
          type="button"
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
                aria-label={t("nav.close")}
                className="hover:bg-muted grid size-10 place-items-center rounded-xl transition"
                type="button"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          {content}
          {user ? (
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
              <SignOutButton />
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Reserves a stable slot and appears only when a slow link is pending. */
function NavigationPendingIndicator() {
  const { pending } = useLinkStatus();
  const t = useTranslations();
  return (
    <AppSpinner
      className={cn(
        "nav-pending-spinner size-4 shrink-0",
        pending && "is-pending",
      )}
      label={t("common.loading")}
    />
  );
}

/** Revokes the current session from the account area. */
export function SignOutButton() {
  const router = useRouter();
  const t = useTranslations();

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
