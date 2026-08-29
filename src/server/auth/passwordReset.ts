import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { createLocalAccountIssuer } from "better-auth/db";

import { passwordResetTokenSchema } from "@/core";
import { env } from "@/env";
import { auth } from "@/server/auth";

/** How long an administrator-issued reset link stays usable. */
const resetLifetimeMs = 60 * 60 * 1000;

/**
 * Reads the stored credential hash for one account.
 *
 * @param userId - The account owner.
 * @returns The stored password hash, or an empty string when none exists.
 */
async function currentPasswordHash(userId: string): Promise<string> {
  const context = await auth.$context;
  const accounts = await context.internalAdapter.findAccounts(userId);
  return (
    accounts.find((account) => account.providerId === "credential")?.password ??
    ""
  );
}

/**
 * Derives the value that ties a reset link to one specific stored password.
 *
 * Because the binding is recomputed on use, changing the password invalidates
 * every link issued beforehand, which makes each link effectively single-use.
 *
 * @param passwordHash - The currently stored password hash.
 * @returns A short digest of the stored hash.
 */
function bindingFor(passwordHash: string): string {
  return createHash("sha256")
    .update(passwordHash)
    .digest("base64url")
    .slice(0, 22);
}

/**
 * Issues a signed, expiring password-reset token for one account.
 *
 * @param userId - The account to be reset.
 * @returns The opaque token to embed in a reset link.
 */
export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({
      binding: bindingFor(await currentPasswordHash(userId)),
      expiresAt: Date.now() + resetLifetimeMs,
      userId,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`password-reset.${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies a reset token and returns the account it authorizes.
 *
 * @param token - The opaque token from the reset link.
 * @returns The account identifier, or null when the token is not usable.
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return null;
  }

  const expected = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`password-reset.${payload}`)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  try {
    const decoded = passwordResetTokenSchema.safeParse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (!decoded.success || decoded.data.expiresAt < Date.now()) {
      return null;
    }
    const binding = bindingFor(await currentPasswordHash(decoded.data.userId));
    return binding === decoded.data.binding ? decoded.data.userId : null;
  } catch {
    return null;
  }
}

/**
 * Sets a new password and signs the account out of every existing session.
 *
 * @param userId - The account being reset.
 * @param newPassword - The replacement password.
 * @returns A promise that resolves when the operation completes.
 */
export async function applyPasswordReset(
  userId: string,
  newPassword: string,
): Promise<void> {
  const context = await auth.$context;
  const hashed = await context.password.hash(newPassword);
  const accounts = await context.internalAdapter.findAccounts(userId);
  if (accounts.some((account) => account.providerId === "credential")) {
    await context.internalAdapter.updatePassword(userId, hashed);
  } else {
    await context.internalAdapter.createAccount({
      accountId: userId,
      issuer: createLocalAccountIssuer("credential"),
      password: hashed,
      providerId: "credential",
      userId,
    });
  }
  await context.internalAdapter.deleteUserSessions(userId);
}
