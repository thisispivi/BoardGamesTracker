import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { resolveClientIp } from "@/server/security/clientIp";
import { hasTrustedOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rateLimit";

const protectedPrefixes = [
  "/dashboard",
  "/collection",
  "/wishlist",
  "/play",
  "/stats",
  "/settings",
  "/admin",
];

const rateLimitWindowMs = 60_000;
const globalRequestLimit = 3_000;
const identityRequestLimit = 300;
const errorReportingOrigin = env.NEXT_PUBLIC_SENTRY_DSN
  ? new URL(env.NEXT_PUBLIC_SENTRY_DSN).origin
  : undefined;

/**
 * Derives a short, non-reversible fingerprint of a caller-supplied secret.
 *
 * Session tokens are credentials, so the limiter keys on a digest rather than
 * holding the token itself in a long-lived in-memory map.
 *
 * @param value - The value to fingerprint.
 * @returns The first 16 bytes of the SHA-256 digest, hex encoded.
 */
async function fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest).slice(0, 16))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Identifies the caller for early per-caller rate limiting.
 *
 * Authenticated callers are keyed by session before the authoritative per-user
 * limit runs during session validation. Anonymous callers are keyed by the
 * nearest untrusted hop in the forwarding chain, which a client cannot forge
 * when the app is reachable only through its reverse proxy.
 *
 * @param request - The incoming request.
 * @param sessionCookie - The session cookie presented by the caller, when any.
 * @returns A stable rate-limit key for the caller.
 */
async function getCallerKey(
  request: NextRequest,
  sessionCookie: string | null,
): Promise<string> {
  if (sessionCookie) {
    return `session:${await fingerprint(sessionCookie)}`;
  }

  return `ip:${resolveClientIp(request.headers.get("x-forwarded-for")) ?? "unknown"}`;
}

/**
 * Reports whether Next.js would try to decode a request as a Server Action.
 *
 * Next.js treats a POST carrying a `Next-Action` header, and any multipart or
 * URL-encoded POST to a page, as a possible Server Action and parses its body.
 * Route handlers under `/api` are not pages and run their own origin checks.
 *
 * @param request - The incoming request.
 * @returns Whether the request would reach the Server Action decoder.
 */
function isServerActionRequest(request: NextRequest): boolean {
  if (
    request.method !== "POST" ||
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    return false;
  }

  const contentType = request.headers.get("content-type") ?? "";
  return (
    request.headers.has("next-action") ||
    contentType.startsWith("multipart/form-data") ||
    contentType.startsWith("application/x-www-form-urlencoded")
  );
}

/**
 * Refuses a request that exhausted its allowance, without leaking why.
 *
 * @returns A generic rate-limit response without sensitive details.
 */
function tooManyRequests(): NextResponse {
  return new NextResponse("Too Many Requests", {
    status: 429,
    headers: {
      "Retry-After": String(rateLimitWindowMs / 1_000),
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * Refuses a request that did not come from the application's own pages.
 *
 * @returns A generic forbidden response without details.
 */
function forbidden(): NextResponse {
  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Applies rate limits, optimistic auth redirects, and a nonce-based security policy.
 *
 * Server Action posts must come from the application's own origin. Browsers
 * always send `Origin` on these requests, while Next.js lets an origin-less
 * post reach its body decoder with only a warning, so scripted probes would
 * otherwise surface as unhandled server errors.
 *
 * @param request - The incoming request.
 * @returns The HTTP response produced for the request.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!consumeRateLimit("global", globalRequestLimit, rateLimitWindowMs)) {
    return tooManyRequests();
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "board_games_tracker",
  });
  const callerKey = await getCallerKey(request, sessionCookie);
  if (!consumeRateLimit(callerKey, identityRequestLimit, rateLimitWindowMs)) {
    return tooManyRequests();
  }

  if (isServerActionRequest(request) && !hasTrustedOrigin(request)) {
    return forbidden();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cf.geekdo-images.com https://react-circle-flags.pages.dev",
    "font-src 'self' data:",
    `connect-src 'self' https://api.geekdo.com${errorReportingOrigin ? ` ${errorReportingOrigin}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

/** Limits proxy execution to documents and application API routes. */
export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
