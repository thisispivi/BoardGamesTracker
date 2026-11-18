import { describe, expect, it } from "vitest";

import {
  gameMetadataResponseSchema,
  gameSearchResponseSchema,
  userDataImportResponseSchema,
} from "@/core";

const discoveryResult = {
  bggId: 68448,
  bggUrl: "https://boardgamegeek.com/boardgame/68448",
  imageUrl: "https://cf.geekdo-images.com/example.jpg",
  isExpansion: false,
  name: "7 Wonders",
  selectionToken: "payload.signature",
  yearPublished: 2010,
};

const metadata = {
  bggId: 68448,
  bggRating: 7.7,
  categories: ["Card Game"],
  description: "Draft a civilization.",
  expandsBggIds: [],
  expansionBggIds: [403_217],
  families: ["Ancient"],
  imageUrl: "https://cf.geekdo-images.com/example.jpg",
  isExpansion: false,
  maxPlayers: 7,
  maxPlaytime: 30,
  mechanics: ["Drafting"],
  minPlayers: 2,
  minPlaytime: 30,
  name: "7 Wonders",
  weight: 2.32,
  yearPublished: 2010,
};

describe("game search response", () => {
  it("accepts a discovery result the server built", () => {
    const parsed = gameSearchResponseSchema.safeParse({
      results: [discoveryResult],
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.results[0]?.bggId).toBe(68448);
  });

  it("reads a missing result list as no results", () => {
    expect(gameSearchResponseSchema.parse({}).results).toEqual([]);
  });

  it("rejects a link pointing somewhere other than BoardGameGeek", () => {
    const parsed = gameSearchResponseSchema.safeParse({
      results: [
        { ...discoveryResult, bggUrl: "https://evil.example/boardgame/68448" },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects artwork hosted outside the BGG image CDN", () => {
    const parsed = gameSearchResponseSchema.safeParse({
      results: [{ ...discoveryResult, imageUrl: "https://evil.example/a.jpg" }],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("game metadata response", () => {
  it("accepts scraped metadata and an absent record alike", () => {
    expect(gameMetadataResponseSchema.parse({ metadata }).metadata).toEqual(
      metadata,
    );
    expect(gameMetadataResponseSchema.parse({}).metadata).toBeNull();
  });

  it("accepts a maximum player count below the minimum", () => {
    const partial = { ...metadata, maxPlayers: 1, minPlayers: 4 };

    expect(
      gameMetadataResponseSchema.safeParse({ metadata: partial }).success,
    ).toBe(true);
  });

  it("rejects a complexity outside the BGG scale", () => {
    const parsed = gameMetadataResponseSchema.safeParse({
      metadata: { ...metadata, weight: 9 },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("user data import response", () => {
  it("defaults a truncated body to an unsuccessful import", () => {
    const parsed = userDataImportResponseSchema.parse({});

    expect(parsed).toEqual({ imported: 0, success: false });
  });

  it("keeps the reported count for a successful import", () => {
    const parsed = userDataImportResponseSchema.parse({
      imported: 42,
      success: true,
    });

    expect(parsed.imported).toBe(42);
  });
});
