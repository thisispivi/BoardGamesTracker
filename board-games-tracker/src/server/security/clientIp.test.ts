import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { TRUSTED_PROXIES: "10.0.0.0/8, 192.168.1.1, fd00::/8" },
}));

import { resolveClientIp, trustedProxies } from "@/server/security/clientIp";

describe("resolveClientIp", () => {
  it("exposes the configured proxies to Better Auth", () => {
    expect(trustedProxies).toEqual(["10.0.0.0/8", "192.168.1.1", "fd00::/8"]);
  });

  it("ignores addresses a client prepends to the forwarding chain", () => {
    expect(resolveClientIp("1.1.1.1, 203.0.113.7, 10.1.2.3")).toBe(
      "203.0.113.7",
    );
    expect(resolveClientIp("1.1.1.1, 203.0.113.7, 192.168.1.1")).toBe(
      "203.0.113.7",
    );
  });

  it("returns the nearest hop when no configured proxy forwarded the request", () => {
    expect(resolveClientIp("1.1.1.1, 198.51.100.4")).toBe("198.51.100.4");
    expect(resolveClientIp("2001:db8::1, fd00::2")).toBe("2001:db8::1");
  });

  it("names no client for a missing, malformed, or proxy-only chain", () => {
    expect(resolveClientIp(null)).toBeNull();
    expect(resolveClientIp("")).toBeNull();
    expect(resolveClientIp("203.0.113.7, not-an-ip")).toBeNull();
    expect(resolveClientIp("10.0.0.1, 10.0.0.2")).toBeNull();
  });

  it("refuses to start with a malformed proxy entry", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({ env: { TRUSTED_PROXIES: "10.0.0.0/33" } }));
    await expect(import("@/server/security/clientIp")).rejects.toThrow(
      "TRUSTED_PROXIES contains an invalid entry: 10.0.0.0/33",
    );
    vi.doUnmock("@/env");
  });
});
