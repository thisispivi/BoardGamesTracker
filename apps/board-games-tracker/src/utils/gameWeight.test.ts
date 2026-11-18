import { describe, expect, it } from "vitest";

import { getGameWeightBand } from "@/utils/gameWeight";

describe("getGameWeightBand", () => {
  it.each([
    [1, "light"],
    [2, "light"],
    [2.1, "medium"],
    [3, "medium"],
    [3.5, "heavy"],
    [4, "heavy"],
    [4.01, "veryHeavy"],
    [5, "veryHeavy"],
  ])("places a complexity of %s in the %s band", (weight, band) => {
    expect(getGameWeightBand(weight)).toBe(band);
  });

  it("gives an unrated game no band at all", () => {
    expect(getGameWeightBand(null)).toBeNull();
  });
});
