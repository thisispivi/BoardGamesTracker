import { describe, expect, it } from "vitest";

import {
  bggCategories,
  bggMechanics,
  getTaxonomyLabel,
  hasExpansionCategory,
  isExpansionCategory,
} from "@/lib/game-taxonomy";

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

  /** Locks complete i18n coverage to BGG's published browse taxonomies. */
  it("localizes every published BGG category and mechanic", () => {
    expect(bggCategories).toHaveLength(85);
    expect(bggMechanics).toHaveLength(200);
    for (const category of bggCategories) {
      expect(getTaxonomyLabel(category, "category", "it")).toBeTruthy();
    }
    for (const mechanic of bggMechanics) {
      expect(getTaxonomyLabel(mechanic, "mechanic", "it")).toBeTruthy();
    }
    expect(getTaxonomyLabel("Worker Placement", "mechanic", "it")).toBe(
      "Piazzamento lavoratori",
    );
    expect(getTaxonomyLabel("Card Game", "category", "it")).toBe(
      "Gioco di carte",
    );
  });
});
