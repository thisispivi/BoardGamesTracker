import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestHeaders } = vi.hoisted(() => ({
  requestHeaders: new Headers(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/logger", () => ({ log: vi.fn() }));
vi.mock("@/env", () => ({ env: { TRUSTED_PROXIES: "10.0.0.0/8" } }));

import { writeAuditEvent } from "@/server/audit";
import { auditLogs } from "@/server/db/schema";
import { setupTestDatabase, testDb } from "@/test/database";

setupTestDatabase();
beforeEach(async () => {
  await testDb.delete(auditLogs);
  for (const name of [...requestHeaders.keys()]) requestHeaders.delete(name);
});

describe("writeAuditEvent", () => {
  it("records the nearest untrusted hop, not an address the client prepended", async () => {
    requestHeaders.set("x-forwarded-for", "1.1.1.1, 203.0.113.7, 10.0.0.2");

    await writeAuditEvent({ action: "test.event", targetType: "test" });

    expect(
      await testDb.select({ ipAddress: auditLogs.ipAddress }).from(auditLogs),
    ).toEqual([{ ipAddress: "203.0.113.7" }]);
  });

  it("ignores a client-supplied X-Real-IP header", async () => {
    requestHeaders.set("x-real-ip", "1.1.1.1");

    await writeAuditEvent({ action: "test.event", targetType: "test" });

    expect(
      await testDb.select({ ipAddress: auditLogs.ipAddress }).from(auditLogs),
    ).toEqual([{ ipAddress: null }]);
  });
});
