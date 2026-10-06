import { File } from "node:buffer";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, importUserDataDocument, parseUserData } = vi.hoisted(
  () => ({
    getSession: vi.fn(),
    importUserDataDocument: vi.fn(),
    parseUserData: vi.fn(),
  }),
);
vi.mock("@/server/session", () => ({ getSession }));
vi.mock("@/server/userData/data", () => ({
  getUserDataDocument: vi.fn(),
  importUserDataDocument,
}));
vi.mock("@/server/userData/formats", () => ({
  getExportMetadata: vi.fn(),
  parseUserData,
  serializeUserData: vi.fn(),
}));
vi.mock("@/server/audit", () => ({ writeAuditEvent: vi.fn() }));
vi.mock("@/server/logger", () => ({ log: vi.fn() }));
vi.mock("@/server/security/origin", () => ({
  hasTrustedOrigin: (request: Request) =>
    request.headers.get("origin") === "https://tracker.test",
}));
vi.mock("@/server/security/rateLimit", () => ({
  consumeRateLimit: () => true,
}));
vi.mock("@/server/revalidate", () => ({ revalidateAccountRoutes: vi.fn() }));

import { POST } from "@/app/api/user-data/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("File", File);
  getSession.mockResolvedValue({ user: { id: "owner" } });
  parseUserData.mockResolvedValue({ items: [] });
  importUserDataDocument.mockResolvedValue(0);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Builds multipart bytes without requiring browser-specific FormData classes.
 *
 * @returns An authenticated same-origin portable-data upload.
 */
function upload(): NextRequest {
  return new NextRequest("https://tracker.test/api/user-data", {
    method: "POST",
    headers: {
      origin: "https://tracker.test",
      "content-type": "multipart/form-data; boundary=export",
    },
    body: '--export\r\nContent-Disposition: form-data; name="file"; filename="backup.json"\r\nContent-Type: application/json\r\n\r\n{}\r\n--export--\r\n',
  });
}

describe("user-data upload boundary", () => {
  it("requires a session before parsing any upload", async () => {
    getSession.mockResolvedValue(null);
    expect((await POST(upload())).status).toBe(401);
    expect(parseUserData).not.toHaveBeenCalled();
  });
  it("rejects a cross-origin upload", async () => {
    const request = upload();
    request.headers.set("origin", "https://attacker.test");
    expect((await POST(request)).status).toBe(403);
    expect(importUserDataDocument).not.toHaveBeenCalled();
  });
  it("stops an oversized stream despite a forged Content-Length", async () => {
    const cancel = vi.fn();
    const request = new NextRequest("https://tracker.test/api/user-data", {
      method: "POST",
      headers: { origin: "https://tracker.test", "content-length": "1" },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(11 * 1024 * 1024));
        },
        cancel,
      }),
    });
    expect((await POST(request)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(parseUserData).not.toHaveBeenCalled();
  });
  it("returns a deliberate client error for malformed multipart bytes", async () => {
    const request = upload();
    request.headers.set("content-type", "multipart/form-data");
    expect((await POST(request)).status).toBe(400);
  });
  it("imports only into the authenticated account", async () => {
    expect((await POST(upload())).status).toBe(200);
    expect(importUserDataDocument).toHaveBeenCalledWith("owner", { items: [] });
  });
  it("distinguishes an unreadable export from a persistence failure", async () => {
    parseUserData.mockRejectedValueOnce(new Error("bad data"));
    expect((await POST(upload())).status).toBe(400);
    importUserDataDocument.mockRejectedValueOnce(new Error("database offline"));
    const failed = await POST(upload());
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: "import_failed" });
  });
});
