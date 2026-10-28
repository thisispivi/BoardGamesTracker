import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Returns the session token from a cookie carrying a valid Better Auth signature.
 *
 * Better Auth stores the cookie as `<token>.<base64 HMAC-SHA256 of token>`.
 * Checking the signature proves the server issued the token without a database
 * lookup, so a client cannot invent cookie values to obtain fresh identities.
 * Only the exact canonical encoding is accepted: a lenient decoder would let
 * one valid cookie be rewritten into many distinct strings that all verify.
 * It does not prove the session is still active.
 *
 * @param cookie - The decoded session cookie value presented by the caller.
 * @param secret - The Better Auth signing secret.
 * @returns The signed session token, or null when the signature does not match.
 */
export function readSignedSessionToken(
  cookie: string,
  secret: string,
): string | null {
  const separator = cookie.lastIndexOf(".");
  if (separator < 1) {
    return null;
  }

  const token = cookie.slice(0, separator);
  const expected = Buffer.from(
    createHmac("sha256", secret).update(token).digest("base64"),
  );
  const supplied = Buffer.from(cookie.slice(separator + 1));
  return supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
    ? token
    : null;
}
