import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";
import { registerExclusively } from "@/server/auth/registration";

/** Better Auth-compatible GET route. */
export const { GET } = toNextJsHandler(auth);

/**
 * Runs signup exclusively while preserving Better Auth's other POST routes.
 *
 * @param request - Authentication request forwarded with its original body.
 * @returns Better Auth's response or a retryable concurrent-signup rejection.
 */
export async function POST(request: Request): Promise<Response> {
  const handler = toNextJsHandler(auth);
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  return path === "/api/auth/sign-up/email"
    ? registerExclusively(() => handler.POST(request))
    : handler.POST(request);
}
