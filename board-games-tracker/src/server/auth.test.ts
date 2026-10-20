import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/logger", () => ({ log: vi.fn() }));
vi.mock("@/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
    ALLOW_SIGN_UP: false,
  },
}));

import { eq } from "drizzle-orm";

import { auth } from "@/server/auth";
import { user } from "@/server/db/schema";
import { setupTestDatabase, testDb } from "@/test/database";

setupTestDatabase();

let cookie = "";
beforeAll(async () => {
  const response = await auth.handler(
    authRequest("sign-up/email", {
      name: "Administrator",
      email: "admin@example.com",
      password: "test-password-long-enough",
    }),
  );
  expect(response.status).toBe(200);
  cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
});

/**
 * Builds a same-origin Better Auth request with the bootstrap session if present.
 *
 * @param path - Authentication endpoint under the standard application base path.
 * @param body - JSON request fields supplied by the test visitor.
 * @returns A request handled by the installed Better Auth implementation.
 */
function authRequest(path: string, body: Record<string, string>): Request {
  return new Request(`http://localhost:3000/api/auth/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      cookie,
    },
    body: JSON.stringify(body),
  });
}

describe("authentication policy", () => {
  it("bootstraps one administrator and closes further registration", async () => {
    expect(await testDb.select({ role: user.role }).from(user)).toEqual([
      { role: "admin" },
    ]);
    const response = await auth.handler(
      authRequest("sign-up/email", {
        name: "Other",
        email: "other@example.com",
        password: "another-long-password",
      }),
    );
    expect(response.ok).toBe(false);
    expect(await testDb.select().from(user)).toHaveLength(1);
  });
  it("blocks the alternate admin API even for an authenticated administrator", async () => {
    const response = await auth.handler(
      authRequest("admin/set-role", { userId: "another-user", role: "admin" }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "USE_ADMIN_CONSOLE" });
  });
  it("prevents the bootstrap administrator from deleting its own account", async () => {
    const response = await auth.handler(
      authRequest("delete-user", { password: "test-password-long-enough" }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "ADMIN_DELETION_REQUIRES_DEMOTION",
    });
    expect(await testDb.select().from(user)).toHaveLength(1);
  });
  it("refuses an email change while mail delivery is not configured", async () => {
    const response = await auth.handler(
      authRequest("change-email", { newEmail: "someone-else@example.com" }),
    );

    expect(response.ok).toBe(false);
    expect(
      await testDb
        .select({ email: user.email })
        .from(user)
        .where(eq(user.name, "Administrator")),
    ).toEqual([{ email: "admin@example.com" }]);
  });

  it("does not promote an unverified ADMIN_EMAIL sign-up when mail is off", async () => {
    vi.resetModules();
    vi.doMock("@/server/db", () => ({ db: testDb }));
    vi.doMock("@/env", () => ({
      env: {
        ADMIN_EMAIL: "owner@example.com",
        ALLOW_SIGN_UP: true,
        BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
        BETTER_AUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NODE_ENV: "test",
      },
    }));
    const { auth: openAuth } = await import("@/server/auth");

    const response = await openAuth.handler(
      authRequest("sign-up/email", {
        name: "Impostor",
        email: "OWNER@example.com",
        password: "impostor-password-long",
      }),
    );

    expect(response.status).toBe(200);
    expect(
      await testDb
        .select({ role: user.role })
        .from(user)
        .where(eq(user.email, "owner@example.com")),
    ).toEqual([{ role: "user" }]);
  });
});
