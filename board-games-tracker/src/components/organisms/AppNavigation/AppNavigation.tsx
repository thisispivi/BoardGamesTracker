"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  ChartNoAxesCombined,
  Dices,
  House,
  Menu,
  Settings,
  Shield,
  ShoppingBag,
  X,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { Logo } from "@/components/atoms/Logo/Logo";
import { SignOutButton } from "@/components/molecules/SignOutButton/SignOutButton";
import { cn } from "@/utils/cn";

/** Authenticated user and viewport mode shown by application navigation. */
type AppNavigationProps = {
  isAdmin: boolean;
  localeSelect?: ReactNode;
  mobile?: boolean;
  user?: { name: string; email: string };
};

/**
 * Active navigation, mobile drawer, and session sign-out.
 *
 * @param root0 - Properties that configure app navigation.
 * @param root0.isAdmin - Whether the managed user currently has administrator privileges.
 * @param root0.localeSelect - Server-rendered language control shown in the drawer, where the sidebar is unavailable.
 * @param root0.mobile - Whether to render the navigation for a narrow viewport.
 * @param root0.user - Authenticated user displayed by the application shell.
 * @returns The rendered app navigation.
 */
export function AppNavigation({
  isAdmin,
  localeSelect,
  mobile = false,
  user,
}: AppNavigationProps): ReactNode {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();
  const links = [
    { href: "/dashboard", label: t("navigation.dashboard"), icon: House },
    { href: "/collection", label: t("navigation.collection"), icon: BookOpen },
    { href: "/wishlist", label: t("navigation.wishlist"), icon: ShoppingBag },
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
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition",
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
          className="bg-card hover:bg-muted grid size-11 place-items-center rounded-lg border shadow-sm transition"
          type="button"
        >
          <Menu className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-100 bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="drawer-content bg-card fixed inset-y-3 right-3 z-101 flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border p-5 shadow-2xl focus:outline-none">
          <Dialog.Title className="sr-only">{t("nav.primary")}</Dialog.Title>
          <div className="flex shrink-0 items-center justify-between border-b pb-4">
            <Logo />
            <Dialog.Close asChild>
              <button
                aria-label={t("nav.close")}
                className="hover:bg-muted grid size-10 place-items-center rounded-lg transition"
                type="button"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          {content}
          {localeSelect ? (
            <div className="mt-4 shrink-0">{localeSelect}</div>
          ) : null}
          {user ? (
            <div className="mt-4 shrink-0 border-t pt-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-11" name={user.name} />
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

/**
 * Reserves a stable slot and appears only when a slow link is pending.
 *
 * @returns A stable navigation slot containing the pending indicator when needed.
 */
function NavigationPendingIndicator(): ReactNode {
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
