import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, scrapeBggMetadata, writeAuditEvent } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  scrapeBggMetadata: vi.fn(),
  writeAuditEvent: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/session", () => ({ requireAdmin }));
vi.mock("@/server/audit", () => ({ writeAuditEvent }));
vi.mock("@/server/bgg/scrape", () => ({ scrapeBggMetadata }));
vi.mock("@/server/logger", () => ({ log: vi.fn() }));
vi.mock("@/server/revalidate", () => ({
  revalidateSharedGameRoutes: vi.fn(),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

import type { BggMetadata } from "@/core";
import {
  refreshGameCatalogBatchAction,
  refreshGameFromBggAction,
} from "@/server/actions/adminGames";
import { games } from "@/server/db/schema";
import { setupTestDatabase, testDb } from "@/test/database";

/**
 * Builds the metadata the scraper returns for one game.
 *
 * @param bggId - BoardGameGeek identifier the metadata belongs to.
 * @param name - Title BoardGameGeek reports for the game.
 * @returns Complete metadata that reports no expansion links.
 */
function bggMetadata(bggId: number, name: string): BggMetadata {
  return {
    bggId,
    bggRating: 7.5,
    categories: ["Strategy"],
    description: "Read from BoardGameGeek",
    expandsBggIds: [],
    expansionBggIds: [],
    families: [],
    imageUrl: null,
    isExpansion: false,
    maxPlayers: 4,
    maxPlaytime: 90,
    mechanics: ["Drafting"],
    minPlayers: 2,
    minPlaytime: 45,
    name,
    weight: 2.5,
    yearPublished: 2020,
  };
}

/**
 * Stores shared games holding placeholder metadata.
 *
 * @param bggIds - BoardGameGeek identifiers of the games to store.
 * @returns Nothing.
 */
async function seedGames(bggIds: number[]): Promise<void> {
  await testDb
    .insert(games)
    .values(bggIds.map((bggId) => ({ bggId, name: `Placeholder ${bggId}` })));
}

setupTestDatabase();
beforeEach(async () => {
  vi.clearAllMocks();
  await testDb.delete(games);
  requireAdmin.mockResolvedValue({ user: { id: "admin", role: "admin" } });
  scrapeBggMetadata.mockImplementation(
    async (ids: number[]) =>
      new Map(ids.map((id) => [id, bggMetadata(id, `Game ${id}`)])),
  );
});

describe("refreshGameCatalogBatchAction", () => {
  it("walks the whole catalog in batches until the cursor runs out", async () => {
    await seedGames(Array.from({ length: 10 }, (_, index) => index + 1));

    const first = await refreshGameCatalogBatchAction(null);
    const second = await refreshGameCatalogBatchAction(first.nextCursor);

    expect(first).toMatchObject({ failed: 0, refreshed: 8, total: 10 });
    expect(first.nextCursor).not.toBeNull();
    expect(second).toEqual({
      failed: 0,
      nextCursor: null,
      refreshed: 2,
      total: 10,
    });
    const names = await testDb.select({ name: games.name }).from(games);
    expect(names.map((game) => game.name).toSorted()).toEqual(
      Array.from({ length: 10 }, (_, index) => `Game ${index + 1}`).toSorted(),
    );
  });

  it("leaves a game unchanged and counts it as failed when BGG returns nothing", async () => {
    await seedGames([1, 2]);
    scrapeBggMetadata.mockResolvedValue(
      new Map([[1, bggMetadata(1, "Refreshed")]]),
    );

    const batch = await refreshGameCatalogBatchAction(null);

    expect(batch).toEqual({
      failed: 1,
      nextCursor: null,
      refreshed: 1,
      total: 2,
    });
    expect(
      await testDb
        .select({ name: games.name })
        .from(games)
        .where(eq(games.bggId, 2)),
    ).toEqual([{ name: "Placeholder 2" }]);
    expect(writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.game_catalog_refreshed_from_bgg",
        metadata: { failed: 1, refreshed: 1 },
      }),
    );
  });

  it("rejects a cursor that is not a game identifier before scraping", async () => {
    await seedGames([1]);

    await expect(refreshGameCatalogBatchAction("1 or 1=1")).rejects.toThrow();
    expect(scrapeBggMetadata).not.toHaveBeenCalled();
  });

  it("refuses a session that is not an administrator", async () => {
    await seedGames([1]);
    requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(refreshGameCatalogBatchAction(null)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(scrapeBggMetadata).not.toHaveBeenCalled();
  });
});

describe("refreshGameFromBggAction", () => {
  it("overwrites one game while keeping expansion links BGG did not report", async () => {
    await testDb
      .insert(games)
      .values({ bggId: 7, expandsBggIds: [3], name: "Placeholder 7" });
    const [stored] = await testDb.select({ id: games.id }).from(games);
    const form = new FormData();
    form.set("gameId", stored?.id ?? "");

    const state = await refreshGameFromBggAction(
      { message: "", success: false },
      form,
    );

    expect(state).toEqual({ message: "adminGames.refreshed", success: true });
    expect(
      await testDb
        .select({ expandsBggIds: games.expandsBggIds, name: games.name })
        .from(games),
    ).toEqual([{ expandsBggIds: [3], name: "Game 7" }]);
  });
});
