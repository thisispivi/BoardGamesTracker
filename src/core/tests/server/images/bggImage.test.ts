import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "https://board-games.example" },
}));

import { downloadBggImage } from "@/server/images/bggImage";
import { hasTrustedOrigin } from "@/server/security/origin";
import { consumeRateLimit } from "@/server/security/rateLimit";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("downloadBggImage", () => {
  it("stores a valid BGG-hosted image with a SHA-256 checksum", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(jpeg, {
          headers: {
            "content-length": String(jpeg.byteLength),
            "content-type": "image/jpeg",
          },
        }),
      ),
    );

    const image = await downloadBggImage(
      "https://cf.geekdo-images.com/example/pic1.jpg",
    );

    expect(image).toMatchObject({
      checksum:
        "fc16d7dcee9cae83ef3923222a81ccd8fe96c9d25fdb7f504d66f1011e0cd870",
      mimeType: "image/jpeg",
      size: jpeg.byteLength,
    });
    expect(image.data).toEqual(jpeg);
  });

  it("rejects non-BGG source hosts before making a request", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    await expect(
      downloadBggImage("https://example.com/cover.jpg"),
    ).rejects.toThrow("approved BGG CDN");
    expect(request).not.toHaveBeenCalled();
  });

  it("rejects a declared image whose file signature does not match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not an image", {
          headers: { "content-type": "image/jpeg" },
        }),
      ),
    );

    await expect(
      downloadBggImage("https://cf.geekdo-images.com/example/pic1.jpg"),
    ).rejects.toThrow("not a valid supported image");
  });
});

describe("server security helpers", () => {
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

  it("rejects requests after a fixed-window allowance is exhausted", () => {
    const key = `test:${crypto.randomUUID()}`;

    expect(consumeRateLimit(key, 2, 60_000)).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000)).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000)).toBe(false);
  });
});
