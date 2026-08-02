import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isCurrentlyBanned } from "@/server/security/ban";

const hour = 60 * 60 * 1000;

describe("isCurrentlyBanned", () => {
  it("treats an account without a ban as allowed", () => {
    expect(isCurrentlyBanned({})).toBe(false);
    expect(isCurrentlyBanned({ banned: false })).toBe(false);
    expect(isCurrentlyBanned({ banned: null })).toBe(false);
  });

  it("blocks a ban with no expiry", () => {
    expect(isCurrentlyBanned({ banned: true })).toBe(true);
    expect(isCurrentlyBanned({ banned: true, banExpires: null })).toBe(true);
  });

  it("blocks a ban that has not expired yet", () => {
    expect(
      isCurrentlyBanned({
        banned: true,
        banExpires: new Date(Date.now() + hour),
      }),
    ).toBe(true);
  });

  it("releases a ban whose expiry has already passed", () => {
    expect(
      isCurrentlyBanned({
        banned: true,
        banExpires: new Date(Date.now() - hour),
      }),
    ).toBe(false);
  });

  it("accepts a serialized expiry timestamp", () => {
    expect(
      isCurrentlyBanned({
        banned: true,
        banExpires: new Date(Date.now() + hour).toISOString(),
      }),
    ).toBe(true);
  });

  it("keeps a ban with an unreadable expiry rather than opening access", () => {
    expect(isCurrentlyBanned({ banned: true, banExpires: "nonsense" })).toBe(
      true,
    );
  });

  it("treats a missing or non-object user as not banned", () => {
    expect(isCurrentlyBanned(null)).toBe(false);
    expect(isCurrentlyBanned(undefined)).toBe(false);
  });
});
