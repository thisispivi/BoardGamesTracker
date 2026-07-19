import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "https://board-games.example" },
}));

import { hasTrustedOrigin } from "@/server/security/origin";

describe("hasTrustedOrigin", () => {
  it("requires a matching Origin or an explicit same-origin fetch signal", () => {
    const matchingOrigin = new Request("https://board-games.example/api", {
      headers: { origin: "https://board-games.example" },
    }) as NextRequest;
    const fetchMetadataFallback = new Request(
      "https://board-games.example/api",
      { headers: { "sec-fetch-site": "same-origin" } },
    ) as NextRequest;
    const unverifiable = new Request(
      "https://board-games.example/api",
    ) as NextRequest;
    const foreignOrigin = new Request("https://board-games.example/api", {
      headers: {
        origin: "https://attacker.example",
        "sec-fetch-site": "same-origin",
      },
    }) as NextRequest;

    expect(hasTrustedOrigin(matchingOrigin)).toBe(true);
    expect(hasTrustedOrigin(fetchMetadataFallback)).toBe(true);
    expect(hasTrustedOrigin(unverifiable)).toBe(false);
    expect(hasTrustedOrigin(foreignOrigin)).toBe(false);
  });
});
