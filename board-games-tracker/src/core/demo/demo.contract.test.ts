import { describe, expect, it } from "vitest";

import { demoDatabaseUrlSchema } from "@/core/demo/demo.contract";

describe("demo database restriction", () => {
  it("accepts only the dedicated local screenshot database", () => {
    expect(
      demoDatabaseUrlSchema.safeParse(
        "postgresql://demo:demo@127.0.0.1:15432/board_games_tracker_demo",
      ).success,
    ).toBe(true);
    for (const value of [
      "postgresql://demo:demo@remote.example/board_games_tracker_demo",
      "postgresql://demo:demo@localhost/board_games_tracker",
      "not a database URL",
    ]) {
      expect(demoDatabaseUrlSchema.safeParse(value).success).toBe(false);
    }
  });
});
