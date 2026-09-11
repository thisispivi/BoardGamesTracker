import { describe, expect, it } from "vitest";

import { appOriginSchema, databaseUrlSchema, httpEndpointSchema } from "@/core";

describe("environment URLs", () => {
  it("normalizes trailing slashes and default ports before links are built", () => {
    expect(appOriginSchema.parse("https://example.com:443/")).toBe(
      "https://example.com",
    );
    expect(appOriginSchema.parse("http://localhost:12500/")).toBe(
      "http://localhost:12500",
    );
  });
  it.each([
    "ftp://example.com",
    "https://user:secret@example.com",
    "https://example.com/app",
    "https://example.com/?token=secret",
    "https://example.com/#fragment",
  ])("rejects an unusable application origin: %s", (url) => {
    expect(appOriginSchema.safeParse(url).success).toBe(false);
  });
  it("accepts private HTTP services but requires PostgreSQL for persistence", () => {
    expect(httpEndpointSchema.safeParse("http://searxng:8080").success).toBe(
      true,
    );
    expect(
      databaseUrlSchema.safeParse(
        "postgresql://user:password@database:5432/app",
      ).success,
    ).toBe(true);
    expect(
      databaseUrlSchema.safeParse("https://database.example.com").success,
    ).toBe(false);
  });
});
