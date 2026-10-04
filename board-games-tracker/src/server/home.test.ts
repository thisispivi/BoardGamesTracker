import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));

import { collectionItems, games, user } from "@/server/db/schema";
import { getHomeSummary } from "@/server/home";
import { setupTestDatabase, testDb } from "@/test/database";

/**
 * Derives a stable catalog row id from a BoardGameGeek id.
 *
 * @param bggId - BoardGameGeek identifier of the seeded game.
 * @returns A version 4 UUID unique to that identifier.
 */
function gameId(bggId: number): string {
  return `00000000-0000-4000-8000-${String(bggId).padStart(12, "0")}`;
}

setupTestDatabase();
beforeEach(async () => {
  await testDb.delete(user);
  await testDb.delete(games);
  await testDb.insert(user).values([
    { id: "owner", name: "Owner", email: "owner@example.com" },
    { id: "other", name: "Other", email: "other@example.com" },
  ]);
  await testDb.insert(games).values([
    { bggId: 1, id: gameId(1), name: "Azul", weight: 1.8 },
    { bggId: 2, id: gameId(2), name: "Brass", weight: 3.9 },
    { bggId: 3, id: gameId(3), name: "Catan", weight: 2.3 },
    {
      bggId: 4,
      expandsBggIds: [3],
      id: gameId(4),
      isExpansion: true,
      name: "Catan: Seafarers",
      weight: 4.5,
    },
    { bggId: 5, id: gameId(5), name: "Dune" },
    { bggId: 6, id: gameId(6), name: "Everdell" },
  ]);
  await testDb.insert(collectionItems).values([
    {
      createdAt: new Date("2026-01-01T10:00:00Z"),
      favorite: true,
      gameId: gameId(1),
      hasPlayed: true,
      moneySpent: 40,
      userId: "owner",
    },
    {
      createdAt: new Date("2026-03-01T10:00:00Z"),
      gameId: gameId(2),
      moneySpent: 60.5,
      userId: "owner",
    },
    {
      createdAt: new Date("2026-02-01T10:00:00Z"),
      gameId: gameId(3),
      userId: "owner",
    },
    {
      createdAt: new Date("2026-04-01T10:00:00Z"),
      gameId: gameId(4),
      hasPlayed: true,
      userId: "owner",
    },
    {
      createdAt: new Date("2026-05-01T10:00:00Z"),
      gameId: gameId(5),
      owned: false,
      userId: "owner",
      wishlist: true,
    },
    {
      favorite: true,
      gameId: gameId(6),
      hasPlayed: true,
      moneySpent: 99,
      userId: "other",
    },
  ]);
});

describe("getHomeSummary", () => {
  it("totals the owned collection without counting the wishlist", async () => {
    expect(await getHomeSummary("owner")).toMatchObject({
      baseGames: 3,
      expansions: 1,
      favorites: 1,
      playedBaseGames: 1,
      totalSpent: 100.5,
      wishlistGames: 1,
    });
  });

  it("lists unplayed base games and recent additions newest first", async () => {
    const summary = await getHomeSummary("owner");

    expect(summary.unplayed.map((game) => game.name)).toEqual([
      "Brass",
      "Catan",
    ]);
    expect(summary.recentlyAdded.map((entry) => entry.game.name)).toEqual([
      "Catan: Seafarers",
      "Brass",
      "Catan",
      "Azul",
    ]);
    expect(summary.recentlyAdded[0]?.addedAt).toEqual(
      new Date("2026-04-01T10:00:00Z"),
    );
  });

  it("leads the showcase with favorites and picks the heaviest base game", async () => {
    const summary = await getHomeSummary("owner");

    expect(summary.showcase[0]?.name).toBe("Azul");
    expect(summary.heaviestGame?.name).toBe("Brass");
    expect(summary.wishlist.map((game) => game.name)).toEqual(["Dune"]);
  });

  it("summarizes only the requested account", async () => {
    const summary = await getHomeSummary("other");

    expect(summary).toMatchObject({
      baseGames: 1,
      heaviestGame: null,
      totalSpent: 99,
      wishlistGames: 0,
    });
    expect(summary.showcase.map((game) => game.name)).toEqual(["Everdell"]);
  });
});
