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

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/session", () => ({ requireAdmin }));
vi.mock("@/server/audit", () => ({ writeAuditEvent: vi.fn() }));
vi.mock("@/server/auth/passwordReset", () => ({
  createPasswordResetToken: vi.fn(async () => "signed"),
}));
vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "https://tracker.test" },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  deleteUserAction,
  toggleUserBanAction,
  updateUserRoleAction,
} from "@/server/actions/admin";
import { getAdminGamesPage } from "@/server/admin/games";
import { session, user } from "@/server/db/schema";
import { migrateTestDatabase, testDatabase, testDb } from "@/test/database";

beforeAll(migrateTestDatabase, 30_000);
afterAll(async () => {
  await testDatabase.close();
});
beforeEach(async () => {
  await testDb.delete(user);
  await testDb.insert(user).values([
    { id: "actor", name: "Admin", email: "actor@example.com", role: "admin" },
    {
      id: "target",
      name: "Target",
      email: "target@example.com",
      role: "admin",
    },
  ]);
  requireAdmin.mockResolvedValue({ user: { id: "actor", role: "admin" } });
});

/**
 * Builds one administrator mutation against the other account.
 *
 * @returns Fields accepted by the role, ban, and deletion actions.
 */
function mutationForm(): FormData {
  const form = new FormData();
  form.set("userId", "target");
  form.set("role", "user");
  form.set("banned", "true");
  return form;
}

describe("administrator account safeguards", () => {
  it("rejects a stale administrator session after demotion", async () => {
    await testDb.update(user).set({ role: "user" }).where(eq(user.id, "actor"));
    await expect(updateUserRoleAction(mutationForm())).rejects.toThrow(
      "no longer authorized",
    );
    expect(
      await testDb
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, "target")),
    ).toEqual([{ role: "admin" }]);
  });
  it("cannot delete the acting administrator", async () => {
    const form = mutationForm();
    form.set("userId", "actor");
    await expect(deleteUserAction(form)).rejects.toThrow("own account");
    expect(await testDb.select().from(user)).toHaveLength(2);
  });
  it("demotes another administrator while retaining the authorized actor", async () => {
    await updateUserRoleAction(mutationForm());
    expect(
      await testDb
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, "admin")),
    ).toEqual([{ id: "actor" }]);
  });
  it("bans an account and revokes its sessions in the same operation", async () => {
    await testDb.insert(session).values({
      id: "session",
      token: "token",
      userId: "target",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await toggleUserBanAction(mutationForm());
    expect(await testDb.select().from(session)).toEqual([]);
    expect(
      await testDb
        .select({ banned: user.banned })
        .from(user)
        .where(eq(user.id, "target")),
    ).toEqual([{ banned: true }]);
  });
  it("removes another account without deleting the actor", async () => {
    await deleteUserAction(mutationForm());
    expect(await testDb.select({ id: user.id }).from(user)).toEqual([
      { id: "actor" },
    ]);
  });
  it("searches a long numeric title without overflowing PostgreSQL integers", async () => {
    expect((await getAdminGamesPage(1, "9".repeat(200))).games).toEqual([]);
  });
});
