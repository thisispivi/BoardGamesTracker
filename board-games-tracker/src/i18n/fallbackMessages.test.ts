import { describe, expect, it } from "vitest";

import { fallbackMessages, getFallbackLocale } from "@/i18n/fallbackMessages";

describe("getFallbackLocale", () => {
  it("reads the locale from a cookie header holding several cookies", () => {
    expect(getFallbackLocale("theme=dark; locale=it; other=1")).toBe("it");
  });

  it("falls back to the default locale for an absent or unknown value", () => {
    expect(getFallbackLocale("")).toBe("en");
    expect(getFallbackLocale("locale=de")).toBe("en");
    expect(getFallbackLocale("mylocale=it")).toBe("en");
  });
});

describe("fallbackMessages", () => {
  it("translates the crash screen into every supported locale", () => {
    for (const messages of Object.values(fallbackMessages)) {
      expect(messages.title.length).toBeGreaterThan(0);
      expect(messages.retry.length).toBeGreaterThan(0);
    }
  });
});
