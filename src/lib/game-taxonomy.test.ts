import { describe, expect, it } from "vitest";

import { hasExpansionCategory, isExpansionCategory } from "@/lib/game-taxonomy";

describe("game taxonomy", () => {
  /** Recognizes BGG's current expansion categories and the legacy import label. */
  it.each([
    "Expansion",
    "Expansion for Base-game",
    "Fan Expansion",
    "Third-party Expansion",
  ])("recognizes %s as an expansion category", (category) => {
    expect(isExpansionCategory(category)).toBe(true);
  });

  /** Does not classify an ordinary thematic category as an expansion. */
  it("keeps base-game categories separate", () => {
    expect(hasExpansionCategory(["Card Game", "Trains"])).toBe(false);
  });
});
