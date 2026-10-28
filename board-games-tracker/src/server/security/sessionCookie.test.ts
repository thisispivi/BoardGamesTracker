import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hasValidSessionSignature } from "@/server/security/sessionCookie";

const secret = "test-secret-with-enough-length-0000000000";

/**
 * Signs a token the way Better Auth signs its session cookie.
 *
 * @param token - Session token to sign.
 * @param key - Signing secret.
 * @returns The cookie value as the proxy reads it.
 */
function sign(token: string, key: string): string {
  return `${token}.${createHmac("sha256", key).update(token).digest("base64")}`;
}

describe("hasValidSessionSignature", () => {
  it("accepts a cookie signed with the application secret", () => {
    expect(
      hasValidSessionSignature(sign("session-token", secret), secret),
    ).toBe(true);
  });

  it.each([
    ["an unsigned value", "session-token"],
    [
      "a random signature",
      "session-token.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    ],
    ["a signature from another secret", sign("session-token", "other-secret")],
    ["a signature over another token", `other${sign("session-token", secret)}`],
    ["an empty token", sign("", secret)],
  ])("rejects %s", (_label, cookie) => {
    expect(hasValidSessionSignature(cookie, secret)).toBe(false);
  });
});
