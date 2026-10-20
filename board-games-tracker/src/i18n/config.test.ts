import { describe, expect, it } from "vitest";

import { isLocale, readLocaleCookie } from "@/i18n/config";

describe("readLocaleCookie", () => {
  it("reads the locale among other cookies", () => {
    expect(readLocaleCookie("theme=dark; locale=it; session=abc")).toBe("it");
  });

  it("ignores cookies whose name only ends in locale", () => {
    expect(readLocaleCookie("mylocale=it")).toBeUndefined();
  });

  it("returns undefined for an empty header", () => {
    expect(readLocaleCookie("")).toBeUndefined();
  });
});

describe("isLocale", () => {
  it("rejects an unsupported locale read from a cookie", () => {
    expect(isLocale(readLocaleCookie("locale=fr"))).toBe(false);
  });
});
