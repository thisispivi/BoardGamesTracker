import { beforeEach, describe, expect, it } from "vitest";

import { account, user } from "@/server/db/schema";
import { setupTestDatabase, testDb } from "@/test/database";

setupTestDatabase();
beforeEach(async () => {
  await testDb.delete(user);
  await testDb.insert(user).values([
    { email: "first@example.com", id: "first", name: "First" },
    { email: "second@example.com", id: "second", name: "Second" },
  ]);
});

describe("account identity constraints", () => {
  it("rejects the same provider identity for a second user", async () => {
    await testDb.insert(account).values({
      accountId: "shared-provider-account",
      id: "first-account",
      providerId: "credential",
      userId: "first",
    });

    await expect(
      testDb.insert(account).values({
        accountId: "shared-provider-account",
        id: "second-account",
        providerId: "credential",
        userId: "second",
      }),
    ).rejects.toThrow();
  });
});
