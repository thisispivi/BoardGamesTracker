import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-only-signing-secret-with-more-than-32-characters",
  },
}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/auth", async () => {
  const { testDb } = await import("@/test/database");
  const { account } = await import("@/server/db/schema");
  const { eq } = await import("drizzle-orm");
  return {
    auth: {
      $context: Promise.resolve({
        password: { hash: async (password: string) => `hashed:${password}` },
        internalAdapter: {
          findAccounts: async (userId: string) =>
            testDb.select().from(account).where(eq(account.userId, userId)),
        },
      }),
    },
  };
});

import {
  applyPasswordReset,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/server/auth/passwordReset";
import { account, session, user } from "@/server/db/schema";
import { migrateTestDatabase, testDatabase, testDb } from "@/test/database";

beforeAll(migrateTestDatabase, 30_000);
afterAll(async () => {
  await testDatabase.close();
});
beforeEach(async () => {
  await testDb.delete(user);
  await testDb
    .insert(user)
    .values({ id: "owner", name: "Owner", email: "owner@example.com" });
  await testDb.insert(account).values({
    id: "credential",
    userId: "owner",
    accountId: "owner",
    providerId: "credential",
    issuer: "credential",
    password: "old-hash",
  });
  await testDb.insert(session).values({
    id: "session",
    token: "session-token",
    userId: "owner",
    expiresAt: new Date(Date.now() + 60_000),
  });
});

describe("password reset authorization", () => {
  it("consumes a valid token once and revokes existing sessions atomically", async () => {
    const token = await createPasswordResetToken("owner");
    expect(await verifyPasswordResetToken(token)).toBe("owner");
    const results = await Promise.all([
      applyPasswordReset("owner", "first-password", token),
      applyPasswordReset("owner", "second-password", token),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await verifyPasswordResetToken(token)).toBeNull();
    expect(await testDb.select().from(session)).toEqual([]);
    const [credential] = await testDb.select().from(account);
    expect(credential?.password).toBe("hashed:first-password");
  });

  it("rejects a token whose account was banned after it was issued", async () => {
    const token = await createPasswordResetToken("owner");
    await testDb.update(user).set({ banned: true }).where(eq(user.id, "owner"));
    expect(await applyPasswordReset("owner", "replacement", token)).toBe(false);
    expect(await testDb.select().from(session)).toHaveLength(1);
  });

  it("rejects forged signatures and credentials changed since issuance", async () => {
    const token = await createPasswordResetToken("owner");
    expect(await verifyPasswordResetToken(`${token}x`)).toBeNull();
    await testDb.update(account).set({ password: "newer-hash" });
    expect(await applyPasswordReset("owner", "replacement", token)).toBe(false);
    expect(await testDb.select().from(session)).toHaveLength(1);
  });
});
