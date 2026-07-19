import { describe, expect, it } from "vitest";

import { normalizeSearchText } from "@/lib/search";

describe("normalizeSearchText", () => {
  it("separates joined numbers and words", () => {
    expect(normalizeSearchText("7wonders")).toBe("7 wonders");
  });

  it("removes English and Italian stop words", () => {
    expect(normalizeSearchText("The game of the stars")).toBe("game stars");
    expect(normalizeSearchText("Il gioco delle stelle")).toBe("gioco stelle");
  });

  it("normalizes punctuation and diacritics", () => {
    expect(normalizeSearchText("Città: Espansione!")).toBe("citta espansione");
  });
});
