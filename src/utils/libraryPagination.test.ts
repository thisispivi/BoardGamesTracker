import { describe, expect, it } from "vitest";

import { paginateLibraryEntries } from "@/utils/libraryPagination";

describe("paginateLibraryEntries", () => {
  it("caps the first section at the shared result limit", () => {
    const page = paginateLibraryEntries(
      Array.from({ length: 60 }, (_, index) => index),
      ["expansion"],
      50,
    );

    expect(page).toMatchObject({ shown: 50, total: 61 });
    expect(page.primary).toHaveLength(50);
    expect(page.secondary).toEqual([]);
  });

  it("uses the remaining budget for the second section", () => {
    const page = paginateLibraryEntries(["a", "b"], ["c", "d"], 3);

    expect(page).toEqual({
      primary: ["a", "b"],
      secondary: ["c"],
      shown: 3,
      total: 4,
    });
  });

  it("treats a negative limit as an empty page", () => {
    expect(paginateLibraryEntries(["a"], ["b"], -1)).toEqual({
      primary: [],
      secondary: [],
      shown: 0,
      total: 2,
    });
  });
});
