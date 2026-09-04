import type { ReactNode } from "react";

import { Logo } from "@/components/atoms/Logo/Logo";
import { LocaleSelect } from "@/components/molecules/LocaleSelect/LocaleSelect";
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle";
import { cn } from "@/utils/cn";

/** Content and width of one signed-out page rendered on the branded canvas. */
type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Branded canvas shared by every page reachable without a session.
 *
 * Sign-in, account recovery, and the error screens all render here, so the
 * background, language switch, and theme toggle stay identical wherever a
 * signed-out visitor lands.
 *
 * @param root0 - Properties that configure auth shell.
 * @param root0.children - Content rendered inside the centered column.
 * @param root0.className - Optional classes merged with the centered column.
 * @returns The rendered signed-out page frame.
 */
export function AuthShell({ children, className }: AuthShellProps): ReactNode {
  return (
    <main className="auth-background relative min-h-dvh overflow-x-hidden">
      <div
        aria-hidden="true"
        className="noise pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative z-10 flex min-h-dvh w-full flex-col px-4 py-4 sm:px-0 sm:py-8">
        <div className="flex justify-end gap-3 sm:fixed sm:top-8 sm:right-8">
          <LocaleSelect />
          <ThemeToggle />
        </div>
        <section
          className={cn(
            "mx-auto my-auto w-full max-w-md py-5 sm:py-8",
            className,
          )}
        >
          <div className="mb-6 flex justify-center sm:mb-8">
            <Logo />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
