import { LocaleSelect } from "@/components/locale-select";
import { Logo } from "@/components/logo";
import { AppNavigation, SignOutButton } from "@/components/app-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null | undefined;
    role?: string | null | undefined;
  };
  labels: {
    dashboard: string;
    collection: string;
    wishlist: string;
    play: string;
    stats: string;
    settings: string;
    admin: string;
    logout: string;
  };
};

/** Responsive navigation shell for signed-in screens. */
export function AppShell({ children, user, labels }: AppShellProps) {
  return (
    <div className="bg-background min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="bg-card sticky top-0 hidden h-screen flex-col border-r px-5 py-6 lg:flex">
        <Logo className="px-2" />
        <AppNavigation labels={labels} isAdmin={user.role === "admin"} />
        <div className="mt-auto space-y-4">
          <div className="bg-muted/70 flex items-center justify-between rounded-xl p-2">
            <LocaleSelect />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 border-t pt-5">
            <span className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold">
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
      </aside>
      <header className="bg-background/90 sticky top-0 z-20 flex h-18 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AppNavigation
            labels={labels}
            isAdmin={user.role === "admin"}
            mobile
            user={user}
          />
        </div>
      </header>
      <div className="min-w-0">
        <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
