import { AppShell } from "@/components/templates/AppShell/AppShell";
import { requireUser } from "@/server/session";

/**
 * Authenticated product shell with server-validated authorization.
 *
 * @param root0 - Properties that configure authenticated layout.
 * @param root0.children - Content rendered inside the component.
 * @returns The rendered authenticated layout.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return <AppShell user={session.user}>{children}</AppShell>;
}
