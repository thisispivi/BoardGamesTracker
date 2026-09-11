import { describe, expect, it } from "vitest";

import { bggImageUrlSchema } from "@/core";

describe("BGG image URLs", () => {
  it("accepts the secure CDN with normal resize queries", () => {
    expect(
      bggImageUrlSchema.safeParse(
        "https://cf.geekdo-images.com/image.jpg?width=500",
      ).success,
    ).toBe(true);
  });
  it.each([
    "https://cf.geekdo-images.com:8443/image.jpg",
    "https://user:secret@cf.geekdo-images.com/image.jpg",
    "https://cf.geekdo-images.com.evil.test/image.jpg",
    "http://cf.geekdo-images.com/image.jpg",
    `https://cf.geekdo-images.com/${"x".repeat(2_000)}`,
  ])("rejects an unsafe artwork URL: %s", (url) => {
    expect(bggImageUrlSchema.safeParse(url).success).toBe(false);
  });
});
