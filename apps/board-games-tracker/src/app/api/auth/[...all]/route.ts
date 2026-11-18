import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";
import { registerExclusively } from "@/server/auth/registration";

/** Better Auth route that creates the account, and the first administrator. */
const signUpPath = "/api/auth/sign-up/email";

const handler = toNextJsHandler(auth);

/** Better Auth-compatible GET route. */
export const { GET } = handler;

/**
 * Reports whether a request targets the account-creation route.
 *
 * The path is decoded, collapsed, and lowercased before it is compared, so an
 * escaped or duplicated separator cannot route to sign-up while presenting a
 * pathname that fails an exact match. Ambiguous encoding resolves to sign-up
 * because serializing a request that turns out to be something else only
 * delays it, while skipping the lock can seat a second administrator.
 *
 * @param url - Absolute request URL as received by the route handler.
 * @returns Whether the request must be serialized against other signups.
 */
function isSignUpRequest(url: string): boolean {
  const { pathname } = new URL(url);
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  return (
    decoded.replaceAll(/\/+/g, "/").replace(/\/$/, "").toLowerCase() ===
    signUpPath
  );
}

/**
 * Runs signup exclusively while preserving Better Auth's other POST routes.
 *
 * @param request - Authentication request forwarded with its original body.
 * @returns Better Auth's response or a retryable concurrent-signup rejection.
 */
export async function POST(request: Request): Promise<Response> {
  return isSignUpRequest(request.url)
    ? registerExclusively(() => handler.POST(request))
    : handler.POST(request);
}
