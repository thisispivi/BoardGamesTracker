import { describe, expect, it } from "vitest";

import { escapeLikePattern } from "@/utils/likePattern";

describe("escapeLikePattern", () => {
  it("escapes percent and underscore so they match literally", () => {
    expect(escapeLikePattern("50%_off")).toBe("50\\%\\_off");
  });

  it("escapes a backslash so it cannot re-enable the wildcard after it", () => {
    expect(escapeLikePattern("a\\%")).toBe("a\\\\\\%");
  });

  it("leaves ordinary titles unchanged", () => {
    expect(escapeLikePattern("Brass: Birmingham")).toBe("Brass: Birmingham");
  });
});
