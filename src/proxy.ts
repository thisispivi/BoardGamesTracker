import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
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
 * limit runs during session validation. Anonymous callers fall back to the
 * forwarded address, which a hostile client can spoof — the global limit is the
 * backstop for that case, not this one.
 *
 * @param request - The incoming request.
 * @returns A stable rate-limit key for the caller.
 */
async function getCallerKey(request: NextRequest): Promise<string> {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "board_games_tracker",
  });
  if (sessionCookie) {
    return `session:${await fingerprint(sessionCookie)}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  return `ip:${forwarded?.split(",")[0]?.trim() || "unknown"}`;
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
 * Applies optimistic auth redirects and a nonce-based security policy.
 *
 * @param request - The incoming request.
 * @returns The HTTP response produced for the request.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!consumeRateLimit("global", globalRequestLimit, rateLimitWindowMs)) {
    return tooManyRequests();
  }

  const callerKey = await getCallerKey(request);
  if (!consumeRateLimit(callerKey, identityRequestLimit, rateLimitWindowMs)) {
    return tooManyRequests();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
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
  const hasSessionCookie = Boolean(
    getSessionCookie(request, { cookiePrefix: "board_games_tracker" }),
  );
  if (isProtected && !hasSessionCookie) {
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
  if (process.env.NODE_ENV === "production") {
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
