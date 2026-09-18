import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  bggIdSchema,
  bggImageUrlSchema,
  booleanStringSchema,
  emptyAsNull,
  refineGameRanges,
  yearPublishedSchema,
} from "@/core";

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
  it.each(["", "not a url", "cf.geekdo-images.com/image.jpg"])(
    "rejects text that is not a URL without throwing: %j",
    (value) => {
      expect(bggImageUrlSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe("catalog primitives", () => {
  it.each([0, -1, 1.5, 10_000_001])(
    "rejects an impossible BoardGameGeek identifier: %s",
    (value) => {
      expect(bggIdSchema.safeParse(value).success).toBe(false);
    },
  );

  it("accepts publication years from early board games to announced ones", () => {
    expect(yearPublishedSchema.safeParse(1800).success).toBe(true);
    expect(yearPublishedSchema.safeParse(2200).success).toBe(true);
    expect(yearPublishedSchema.safeParse(1799).success).toBe(false);
    expect(yearPublishedSchema.safeParse(2024.5).success).toBe(false);
  });

  it("reads only the literal words true and false as Booleans", () => {
    expect(booleanStringSchema.parse("true")).toBe(true);
    expect(booleanStringSchema.parse("false")).toBe(false);
    expect(booleanStringSchema.safeParse("yes").success).toBe(false);
    expect(booleanStringSchema.safeParse(true).success).toBe(false);
    expect(booleanStringSchema.safeParse(null).success).toBe(false);
  });
});

describe("emptyAsNull", () => {
  const rating = emptyAsNull(z.coerce.number().min(0).max(10));

  it("treats a missing or untouched form field as null", () => {
    expect(rating.parse(null)).toBeNull();
    expect(rating.parse("")).toBeNull();
  });

  it("still validates a value the user typed", () => {
    expect(rating.parse("7.5")).toBe(7.5);
    expect(rating.safeParse("11").success).toBe(false);
    expect(rating.safeParse("seven").success).toBe(false);
  });
});

describe("refineGameRanges", () => {
  const ranges = z
    .object({
      maxPlayers: z.number(),
      maxPlaytime: z.number(),
      minPlayers: z.number(),
      minPlaytime: z.number(),
    })
    .superRefine(refineGameRanges);

  it("accepts an equal or ascending range", () => {
    expect(
      ranges.safeParse({
        maxPlayers: 4,
        maxPlaytime: 60,
        minPlayers: 4,
        minPlaytime: 30,
      }).success,
    ).toBe(true);
  });

  it("reports each inverted range against its upper field", () => {
    const parsed = ranges.safeParse({
      maxPlayers: 1,
      maxPlaytime: 10,
      minPlayers: 2,
      minPlaytime: 30,
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((issue) => issue.path)).toEqual([
      ["maxPlayers"],
      ["maxPlaytime"],
    ]);
  });
});
