import { describe, expect, it } from "vitest";

import { normalizeMailActionUrl } from "@/utils/mailActionUrl";

describe("normalizeMailActionUrl", () => {
  it("moves a trusted auth action onto the public application origin", () => {
    expect(
      normalizeMailActionUrl(
        "http://auth.internal:12500/api/auth/verify-email?token=opaque#ignored",
        "https://games.example.com",
        "http://auth.internal:12500",
      ),
    ).toBe("https://games.example.com/api/auth/verify-email?token=opaque");
  });

  it("rejects a spoofed action origin", () => {
    expect(
      normalizeMailActionUrl(
        "https://games.example.com.attacker.test/reset?token=secret",
        "https://games.example.com",
        "http://auth.internal:12500",
      ),
    ).toBeNull();
  });

  it("rejects non-web action protocols", () => {
    expect(
      normalizeMailActionUrl(
        "javascript:alert(1)",
        "https://games.example.com",
        "http://auth.internal:12500",
      ),
    ).toBeNull();
  });
});
