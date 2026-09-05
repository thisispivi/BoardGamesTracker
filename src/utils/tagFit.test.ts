import { describe, expect, it } from "vitest";

import { countFittingTags } from "@/utils/tagFit";

describe("countFittingTags", () => {
  it("keeps every pill when the whole row fits", () => {
    expect(countFittingTags([40, 60, 50], 6, 200, 30)).toBe(3);
  });

  it("reserves room for the overflow chip when a pill is dropped", () => {
    expect(countFittingTags([40, 60, 50], 6, 120, 30)).toBe(1);
  });

  it("drops every pill when not even the first one fits", () => {
    expect(countFittingTags([400], 6, 120, 30)).toBe(0);
  });

  it("returns zero for an empty row", () => {
    expect(countFittingTags([], 6, 200, 30)).toBe(0);
  });
});
