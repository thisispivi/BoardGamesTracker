import { describe, expect, it } from "vitest";

import { getInitials } from "@/utils/initials";

describe("getInitials", () => {
  it("combines the given name and the surname", () => {
    expect(getInitials("Andrea Piras")).toBe("AP");
  });

  it("skips middle names so the result stays two characters", () => {
    expect(getInitials("  Anna   Maria   De Luca ")).toBe("AL");
  });

  it("returns a single letter for a one-word name", () => {
    expect(getInitials("prince")).toBe("P");
  });

  it("returns nothing for a blank name so callers can fall back", () => {
    expect(getInitials("   ")).toBe("");
  });

  it("keeps a surrogate pair intact", () => {
    expect(getInitials("𝒜lice Wong")).toBe("𝒜W");
  });
});
