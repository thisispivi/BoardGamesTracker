import type { ReactNode } from "react";

import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { Logo } from "@/components/atoms/Logo/Logo";
import { LocaleSelect } from "@/components/molecules/LocaleSelect/LocaleSelect";
import { SignOutButton } from "@/components/molecules/SignOutButton/SignOutButton";
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle";
import { AppNavigation } from "@/components/organisms/AppNavigation/AppNavigation";

/** Authenticated user and route content rendered by the application shell. */
type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null | undefined;
    role?: string | null | undefined;
  };
};

/**
 * Responsive navigation shell for signed-in screens.
 *
 * @param root0 - Properties that configure app shell.
 * @param root0.children - Content rendered inside the component.
 * @param root0.user - Authenticated user displayed by the application shell.
 * @returns The rendered app shell.
 */
export function AppShell({ children, user }: AppShellProps): ReactNode {
  return (
    <div className="bg-background min-h-screen w-full max-w-full overflow-x-clip lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="bg-card sticky top-0 hidden h-screen flex-col border-r px-5 py-6 lg:flex">
        <Logo className="px-2" />
        <AppNavigation isAdmin={user.role === "admin"} />
        <div className="mt-auto space-y-4">
          <div className="bg-muted/70 flex items-center gap-1 rounded-lg p-1">
            <LocaleSelect />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 border-t pt-5">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <header className="bg-background/90 sticky top-0 z-20 flex h-18 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
        <Logo className="min-[360px]:hidden" compact />
        <Logo className="hidden min-[360px]:inline-flex" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AppNavigation
            isAdmin={user.role === "admin"}
            localeSelect={<LocaleSelect />}
            mobile
            user={user}
          />
        </div>
      </header>
      <div className="isolate max-w-full min-w-0 overflow-x-clip">
        <main className="mx-auto w-full max-w-375 min-w-0 px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
