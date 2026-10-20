import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "https://board-games.example", NODE_ENV: "test" },
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
