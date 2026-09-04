import { describe, expect, it } from "vitest";

import type { CollectionGame } from "@/core";
import { redactSharedGames } from "@/utils/shareRedaction";

const ownedGame: CollectionGame = {
  id: "6f1d0b6e-7c1f-4c2b-9a2e-2f4c8b1d0a11",
  favorite: true,
  personalRating: 9.5,
  notes: "Sleeved, box is dented",
  moneySpent: 42.5,
  gifted: true,
  gameId: "0a2c4e6f-8b1d-4f3a-9c5e-7d1b3f5a9c22",
  bggId: 68448,
  name: "7 Wonders",
  imageUrl: "/api/game-images/abc",
  thumbnailUrl: "/api/game-images/abc",
  yearPublished: 2010,
  minPlayers: 2,
  maxPlayers: 7,
  minPlaytime: 30,
  maxPlaytime: 30,
  weight: 2.32,
  bggRating: 7.7,
  isExpansion: false,
  expandsBggIds: [],
  expansionBggIds: [403_217],
  categories: ["Card Game"],
  mechanics: ["Drafting"],
  families: ["Ancient"],
};

describe("shared library redaction", () => {
  it("removes notes and personal ratings even when prices are shared", () => {
    const [shared] = redactSharedGames([ownedGame], true);

    expect(shared?.notes).toBe("");
    expect(shared?.personalRating).toBeNull();
  });

  it("keeps what the owner paid when prices are shared", () => {
    const [shared] = redactSharedGames([ownedGame], true);

    expect(shared?.moneySpent).toBe(42.5);
    expect(shared?.gifted).toBe(true);
  });

  it("hides both the price and the gift flag when prices are not shared", () => {
    const [shared] = redactSharedGames([ownedGame], false);

    expect(shared?.moneySpent).toBe(0);
    expect(shared?.gifted).toBe(false);
  });

  it("leaves no private value anywhere in the serialized output", () => {
    const serialized = JSON.stringify(redactSharedGames([ownedGame], false));

    expect(serialized).not.toContain("Sleeved");
    expect(serialized).not.toContain("9.5");
    expect(serialized).not.toContain("42.5");
  });

  it("keeps the public game facts a visitor came to see", () => {
    const [shared] = redactSharedGames([ownedGame], false);

    expect(shared).toMatchObject({
      bggId: 68448,
      favorite: true,
      maxPlayers: 7,
      name: "7 Wonders",
      weight: 2.32,
    });
  });

  it("does not mutate the owner's own entries", () => {
    redactSharedGames([ownedGame], false);

    expect(ownedGame.notes).toBe("Sleeved, box is dented");
    expect(ownedGame.moneySpent).toBe(42.5);
  });
});
