import { describe, expect, it, vi } from "vitest";

const { post, registerExclusively } = vi.hoisted(() => ({
  post: vi.fn(async () => Response.json({ handled: true })),
  registerExclusively: vi.fn(async (register: () => Promise<Response>) =>
    register(),
  ),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => ({ auth: {} }));
vi.mock("@/server/auth/registration", () => ({ registerExclusively }));
vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({ GET: vi.fn(), POST: post }),
}));

import { POST } from "@/app/api/auth/[...all]/route";

/**
 * Posts one authentication request and reports whether it was serialized.
 *
 * @param path - Request path exactly as it arrives on the wire.
 * @returns Whether the signup lock wrapped the Better Auth handler.
 */
async function locksSignup(path: string): Promise<boolean> {
  registerExclusively.mockClear();
  await POST(new Request(`https://example.test${path}`, { method: "POST" }));
  return registerExclusively.mock.calls.length === 1;
}

describe("authentication POST routing", () => {
  it("serializes the account-creation route", async () => {
    expect(await locksSignup("/api/auth/sign-up/email")).toBe(true);
  });

  it("serializes a signup disguised by an escaped separator", async () => {
    expect(await locksSignup("/api/auth/sign-up%2Femail")).toBe(true);
  });

  it("serializes a signup padded with duplicate or trailing separators", async () => {
    expect(await locksSignup("//api/auth//sign-up/email/")).toBe(true);
  });

  it("serializes a signup written in mixed case", async () => {
    expect(await locksSignup("/api/auth/Sign-Up/Email")).toBe(true);
  });

  it("leaves every other authentication route unserialized", async () => {
    expect(await locksSignup("/api/auth/sign-in/email")).toBe(false);
    expect(await locksSignup("/api/auth/sign-up/email/extra")).toBe(false);
  });

  it("forwards the original request to Better Auth", async () => {
    post.mockClear();
    const request = new Request("https://example.test/api/auth/sign-in/email", {
      method: "POST",
    });
    await POST(request);
    expect(post).toHaveBeenCalledWith(request);
  });
});
