import { AppShell } from "@/components/app-shell";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/session";

/** Authenticated product shell with server-validated authorization. */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, dictionary] = await Promise.all([
    requireUser(),
    getDictionary(),
  ]);

  return (
    <AppShell user={session.user} labels={dictionary}>
      {children}
    </AppShell>
  );
}
