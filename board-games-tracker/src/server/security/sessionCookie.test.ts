import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readSignedSessionToken } from "@/server/security/sessionCookie";

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

const signed = sign("session-token", secret);

describe("readSignedSessionToken", () => {
  it("returns the token of a cookie signed with the application secret", () => {
    expect(readSignedSessionToken(signed, secret)).toBe("session-token");
  });

  it.each([
    ["an unsigned value", "session-token"],
    [
      "a random signature",
      "session-token.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    ],
    ["a signature from another secret", sign("session-token", "other-secret")],
    ["a signature over another token", `other${signed}`],
    ["an empty token", sign("", secret)],
    ["a signature with a trailing character", `${signed}!`],
    ["a signature with extra padding", `${signed}=`],
    ["a signature without its padding", signed.slice(0, -1)],
    ["a signature with a leading space", signed.replace(".", ". ")],
  ])("rejects %s", (_label, cookie) => {
    expect(readSignedSessionToken(cookie, secret)).toBeNull();
  });
});
