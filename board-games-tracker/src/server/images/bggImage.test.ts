import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { StoredGameImage } from "@/core";
import { downloadBggImage, downloadBggImages } from "@/server/images/bggImage";

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

describe("downloadBggImages", () => {
  it("stores each image as it downloads and returns only checksums", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: URL) =>
        url.pathname.endsWith("missing.jpg")
          ? new Response(null, { status: 404 })
          : new Response(jpeg, { headers: { "content-type": "image/jpeg" } }),
      ),
    );
    const stored: Array<[number, StoredGameImage]> = [];

    const checksums = await downloadBggImages(
      new Map([
        [1, "https://cf.geekdo-images.com/example/pic1.jpg"],
        [2, "https://cf.geekdo-images.com/example/missing.jpg"],
      ]),
      async (bggId, image) => {
        stored.push([bggId, image]);
      },
    );

    expect(stored.map(([bggId]) => bggId)).toEqual([1]);
    expect(checksums).toEqual(
      new Map([
        [1, "fc16d7dcee9cae83ef3923222a81ccd8fe96c9d25fdb7f504d66f1011e0cd870"],
      ]),
    );
  });

  it("skips an image whose storage fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(jpeg, { headers: { "content-type": "image/jpeg" } }),
      ),
    );

    const checksums = await downloadBggImages(
      new Map([[1, "https://cf.geekdo-images.com/example/pic1.jpg"]]),
      async () => {
        throw new Error("storage unavailable");
      },
    );

    expect(checksums.size).toBe(0);
  });
});
