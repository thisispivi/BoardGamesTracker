import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Reports whether a session cookie carries a valid Better Auth signature.
 *
 * Better Auth stores the cookie as `<token>.<base64 HMAC-SHA256 of token>`.
 * Checking the signature proves the server issued the token without a database
 * lookup, so a client cannot invent cookie values to obtain fresh identities.
 * It does not prove the session is still active.
 *
 * @param cookie - The decoded session cookie value presented by the caller.
 * @param secret - The Better Auth signing secret.
 * @returns Whether the signature matches the token.
 */
export function hasValidSessionSignature(
  cookie: string,
  secret: string,
): boolean {
  const separator = cookie.lastIndexOf(".");
  if (separator < 1) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(cookie.slice(0, separator))
    .digest();
  const supplied = Buffer.from(cookie.slice(separator + 1), "base64");
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
