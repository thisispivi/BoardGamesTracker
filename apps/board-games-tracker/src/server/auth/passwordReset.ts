import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { passwordResetTokenSchema } from "@/core";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { account, session, user } from "@/server/db/schema";
import { isCurrentlyBanned } from "@/server/security/ban";

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
 * Verifies the signature and expiry of bounded password-reset authorization.
 *
 * @param token - The opaque token from the reset link.
 * @returns The authenticated payload, or null when the token is not usable.
 */
function readPasswordResetToken(
  token: string,
): ReturnType<typeof passwordResetTokenSchema.parse> | null {
  if (token.length > 4_000) return null;
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
    if (!decoded.success || decoded.data.expiresAt <= Date.now()) {
      return null;
    }
    return decoded.data;
  } catch {
    return null;
  }
}

/**
 * Checks a reset link against the account's current stored password.
 *
 * @param token - Signed reset authorization presented by the visitor.
 * @returns The authorized account, or null for an expired or consumed token.
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const decoded = readPasswordResetToken(token);
  if (!decoded) return null;
  const binding = bindingFor(await currentPasswordHash(decoded.userId));
  return binding === decoded.binding ? decoded.userId : null;
}

/**
 * Sets a new password and signs the account out of every existing session.
 *
 * @param userId - The account being reset.
 * @param newPassword - The replacement password.
 * @param token - Signed reset authorization checked again under the credential lock.
 * @returns Whether the token was consumed and every existing session revoked.
 */
export async function applyPasswordReset(
  userId: string,
  newPassword: string,
  token: string,
): Promise<boolean> {
  const context = await auth.$context;
  const hashed = await context.password.hash(newPassword);
  return db.transaction(async (transaction) => {
    const [owner] = await transaction
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .for("update");
    if (!owner || isCurrentlyBanned(owner)) return false;
    const [credential] = await transaction
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "credential")),
      )
      .for("update");
    const decoded = readPasswordResetToken(token);
    if (
      !decoded ||
      decoded.userId !== userId ||
      decoded.binding !== bindingFor(credential?.password ?? "")
    )
      return false;
    if (credential) {
      await transaction
        .update(account)
        .set({ password: hashed, updatedAt: new Date() })
        .where(and(eq(account.id, credential.id), eq(account.userId, userId)));
    } else {
      await transaction.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        password: hashed,
        providerId: "credential",
        userId,
      });
    }
    await transaction.delete(session).where(eq(session.userId, userId));
    return true;
  });
}
