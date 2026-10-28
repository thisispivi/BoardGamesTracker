import { createHmac } from "node:crypto";

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-with-enough-length-0000000000",
    NEXT_PUBLIC_APP_URL: "https://board-games.example",
    NODE_ENV: "test",
  },
}));

import { config, proxy } from "@/proxy";

const appOrigin = "https://board-games.example";

/**
 * Builds a POST to the application with the given headers.
 *
 * @param path - Application path the request targets.
 * @param headers - Headers sent with the request.
 * @returns A request as the proxy receives it.
 */
function post(path: string, headers: Record<string, string>): NextRequest {
  return new NextRequest(`${appOrigin}${path}`, {
    body: "0=%5B%5D",
    headers,
    method: "POST",
  });
}

describe("proxy", () => {
  it("refuses a Server Action post that carries no Origin header", async () => {
    const response = await proxy(
      post("/", {
        "content-type": "multipart/form-data; boundary=probe",
        "next-action": "7f00000000000000000000000000000000000000",
      }),
    );

    expect(response.status).toBe(403);
  });

  it("refuses a form post sent from another origin", async () => {
    const response = await proxy(
      post("/login", {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://attacker.example",
      }),
    );

    expect(response.status).toBe(403);
  });

  it("lets a Server Action from the application's own origin through", async () => {
    const response = await proxy(
      post("/login", {
        "content-type": "text/plain;charset=UTF-8",
        "next-action": "7f00000000000000000000000000000000000000",
        origin: appOrigin,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "form-action 'self'",
    );
  });

  it("leaves API route posts to the origin checks in their handlers", async () => {
    const response = await proxy(
      post("/api/library", { "content-type": "application/json" }),
    );

    expect(response.status).toBe(200);
  });

  it("does not change ordinary page requests", async () => {
    const response = await proxy(new NextRequest(`${appOrigin}/login`));

    expect(response.status).toBe(200);
  });

  it.each(["/play", "/admin/users"])(
    "sends an anonymous visitor on %s to the login page",
    async (path) => {
      const response = await proxy(new NextRequest(`${appOrigin}${path}`));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${appOrigin}/login`);
    },
  );

  it.each(["/playground", "/administrator"])(
    "does not treat %s as a protected route",
    async (path) => {
      const response = await proxy(new NextRequest(`${appOrigin}${path}`));

      expect(response.status).toBe(200);
    },
  );

  it("rate-limits forged session cookies by client address", async () => {
    /**
     * Sends one page request carrying a fresh, unsigned session cookie.
     *
     * @returns The proxy's response.
     */
    function sendForgedCookie(): Promise<Response> {
      return proxy(
        new NextRequest(`${appOrigin}/login`, {
          headers: {
            cookie: `board_games_tracker.session_token=${crypto.randomUUID()}.forged`,
            "x-forwarded-for": "203.0.113.9",
          },
        }),
      );
    }

    for (let attempt = 0; attempt < 300; attempt += 1) {
      expect((await sendForgedCookie()).status).toBe(200);
    }
    expect((await sendForgedCookie()).status).toBe(429);
  });

  it("gives every spelling of one signed cookie the same bucket", async () => {
    const token = crypto.randomUUID();
    const signature = createHmac(
      "sha256",
      "test-secret-with-enough-length-0000000000",
    )
      .update(token)
      .digest("base64");

    for (let attempt = 0; attempt < 300; attempt += 1) {
      const response = await proxy(
        new NextRequest(`${appOrigin}/login`, {
          headers: {
            cookie: `board_games_tracker.session_token=${token}.${signature}`,
            "x-forwarded-for": `198.51.100.${attempt % 250}`,
          },
        }),
      );
      expect(response.status).toBe(200);
    }
    const variant = await proxy(
      new NextRequest(`${appOrigin}/login`, {
        headers: {
          cookie: `board_games_tracker.session_token=${token}.${signature}!`,
          "x-forwarded-for": "198.51.100.251",
        },
      }),
    );
    const exhausted = await proxy(
      new NextRequest(`${appOrigin}/login`, {
        headers: {
          cookie: `board_games_tracker.session_token=${token}.${signature}`,
          "x-forwarded-for": "198.51.100.252",
        },
      }),
    );

    expect(variant.status).toBe(200);
    expect(exhausted.status).toBe(429);
  });

  it.each([{ "next-router-prefetch": "1" }, { purpose: "prefetch" }])(
    "still rate-limits requests that claim to be prefetches: %o",
    (headers) => {
      expect(
        unstable_doesMiddlewareMatch({ config, headers, url: "/collection" }),
      ).toBe(true);
    },
  );

  it("skips static assets and the health check", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: "/_next/static/chunk.js" }),
    ).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, url: "/api/health" })).toBe(
      false,
    );
  });
});
