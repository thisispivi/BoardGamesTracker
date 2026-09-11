import { describe, expect, it } from "vitest";

import { labelSchema } from "@/core";
import {
  bggCategories,
  bggMechanics,
  getTaxonomyLabel,
  hasExpansionCategory,
  isExpansionCategory,
  maxTaxonomyLabelLength,
  parseTaxonomyLabels,
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

  it("caps a label at the length the portable export can re-import", () => {
    const long = "x".repeat(maxTaxonomyLabelLength + 40);

    const [label] = parseTaxonomyLabels(long);

    expect(label).toHaveLength(maxTaxonomyLabelLength);
    expect(labelSchema.safeParse(label).success).toBe(true);
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

describe("parseTaxonomyLabels", () => {
  it("trims entries and drops blanks and repeats", () => {
    expect(parseTaxonomyLabels(" Deck  ,, Deck ,Trains,")).toEqual([
      "Deck",
      "Trains",
    ]);
  });

  it("returns nothing for an empty or separator-only field", () => {
    expect(parseTaxonomyLabels("")).toEqual([]);
    expect(parseTaxonomyLabels(" , , ")).toEqual([]);
  });

  it("caps a hostile field at fifty labels", () => {
    const flood = Array.from({ length: 500 }, (_, index) => `label-${index}`);

    expect(parseTaxonomyLabels(flood.join(","))).toHaveLength(50);
  });
});
