import { AppShell } from "@/components/templates/AppShell/AppShell";
import { requireUser } from "@/server/session";

/** Authenticated product shell with server-validated authorization. */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return <AppShell user={session.user}>{children}</AppShell>;
}
