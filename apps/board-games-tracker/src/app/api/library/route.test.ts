import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLibraryPage, getSession } = vi.hoisted(() => ({
  getLibraryPage: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("@/server/session", () => ({ getSession }));
vi.mock("@/server/collection", () => ({ getLibraryPage }));
vi.mock("@/server/logger", () => ({ log: vi.fn() }));
vi.mock("@/server/security/origin", () => ({
  hasTrustedOrigin: (request: Request) =>
    request.headers.get("origin") === "https://tracker.test",
}));
vi.mock("@/server/security/rateLimit", () => ({
  consumeRateLimit: () => true,
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

import { POST } from "@/app/api/library/route";
import { createFirstPageQuery } from "@/utils/libraryPages";

/**
 * Builds a library request carrying a raw body.
 *
 * @param body - Serialized request body.
 * @param origin - Origin header sent by the browser.
 * @returns A request for the library endpoint.
 */
function libraryRequest(
  body: string,
  origin = "https://tracker.test",
): NextRequest {
  return new NextRequest("https://tracker.test/api/library", {
    body,
    headers: { origin },
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ user: { id: "owner" } });
  getLibraryPage.mockResolvedValue({
    baseGameCount: 0,
    expansionCount: 0,
    games: [],
    nextOffset: 0,
    total: 0,
  });
});

describe("POST /api/library", () => {
  it("loads the requested window for the signed-in account", async () => {
    const response = await POST(
      libraryRequest(
        JSON.stringify({ ...createFirstPageQuery(), location: "wishlist" }),
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(getLibraryPage).toHaveBeenCalledWith(
      "owner",
      expect.objectContaining({ location: "wishlist", offset: 0 }),
    );
  });

  it("rejects a request that names an account", async () => {
    const response = await POST(
      libraryRequest(
        JSON.stringify({
          ...createFirstPageQuery(),
          location: "collection",
          userId: "other",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(getLibraryPage).not.toHaveBeenCalled();
  });

  it("rejects a window larger than any reload", async () => {
    const response = await POST(
      libraryRequest(
        JSON.stringify({
          ...createFirstPageQuery(),
          limit: 5_000,
          location: "collection",
        }),
      ),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a body that is not JSON", async () => {
    expect((await POST(libraryRequest("{"))).status).toBe(400);
  });

  it("refuses anonymous and cross-site requests", async () => {
    const body = JSON.stringify({
      ...createFirstPageQuery(),
      location: "collection",
    });

    expect(
      (await POST(libraryRequest(body, "https://attacker.test"))).status,
    ).toBe(403);
    getSession.mockResolvedValueOnce(null);
    expect((await POST(libraryRequest(body))).status).toBe(401);
    expect(getLibraryPage).not.toHaveBeenCalled();
  });
});
