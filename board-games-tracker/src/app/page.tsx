import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSession } from "@/server/session";

/**
 * Routes visitors directly to authentication or their dashboard.
 *
 * @returns The rendered home page.
 */
export default async function HomePage(): Promise<ReactNode> {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}
