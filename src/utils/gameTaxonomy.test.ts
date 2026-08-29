import { describe, expect, it } from "vitest";

import {
  bggCategories,
  bggMechanics,
  getTaxonomyLabel,
  hasExpansionCategory,
  isExpansionCategory,
} from "@/utils/gameTaxonomy";

describe("game taxonomy", () => {
  it.each([
    "Expansion",
    "Expansion for Base-game",
    "Fan Expansion",
    "Third-party Expansion",
  ])("recognizes %s as an expansion category", (category) => {
    expect(isExpansionCategory(category)).toBe(true);
  });

  it("keeps base-game categories separate", () => {
    expect(hasExpansionCategory(["Card Game", "Trains"])).toBe(false);
  });

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
