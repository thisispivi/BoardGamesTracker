import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { libraryPageRequestSchema } from "@/core";
import { getLibraryPage } from "@/server/collection";
import { log } from "@/server/logger";
import { hasTrustedOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rateLimit";
import { getSession } from "@/server/session";
import { readBoundedBody } from "@/utils/readBoundedBody";

/** Largest JSON body accepted for one request, far above any valid filter state. */
const maxRequestBytes = 32 * 1024;

/** Library requests one account may make per minute; fast scrolling needs a few. */
const requestLimit = 120;

/** Headers that keep a private library out of every shared cache. */
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" };

/**
 * Answers with the generic translated failure the browser shows for any error.
 *
 * @param message - Translated failure sentence.
 * @param status - HTTP status describing the failure.
 * @returns A non-cacheable JSON error response.
 */
function failure(message: string, status: number): Response {
  return Response.json({ error: message }, { headers: privateHeaders, status });
}

/**
 * Serves one filtered window of the signed-in user's collection or wishlist.
 *
 * The route is a POST only so the complete filter state travels as JSON; it
 * never changes data. Results are scoped to the session's account, and a body
 * naming anything beyond filters, location, and window is rejected.
 *
 * @param request - Incoming request carrying filters, location, and result window.
 * @returns The page as JSON, or a translated error with a matching status.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const t = await getTranslations("libraryPagination");
  const session = await getSession();
  if (!session) return failure(t("loadError"), 401);
  if (!hasTrustedOrigin(request)) return failure(t("loadError"), 403);
  if (!consumeRateLimit(`library:${session.user.id}`, requestLimit, 60_000)) {
    return failure(t("loadError"), 429);
  }

  let body: unknown;
  try {
    const bytes = await readBoundedBody(request.body, maxRequestBytes);
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return failure(t("loadError"), 400);
  }
  const parsed = libraryPageRequestSchema.safeParse(body);
  if (!parsed.success) return failure(t("loadError"), 400);

  try {
    const page = await getLibraryPage(session.user.id, parsed.data);
    return Response.json({ page }, { headers: privateHeaders });
  } catch (error) {
    log("error", "library_page_failed", {
      actorId: session.user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return failure(t("loadError"), 500);
  }
}
