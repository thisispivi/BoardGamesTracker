import { redirect } from "next/navigation";

import { getSession } from "@/server/session";

/**
 * Routes visitors directly to authentication or their dashboard.
 *
 * @returns The rendered home page.
 */
export default async function HomePage() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}
