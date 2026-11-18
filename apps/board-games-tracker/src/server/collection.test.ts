import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));

import type { LibraryFilters, LibraryPageRequest } from "@/core";
import { getLibraryPage } from "@/server/collection";
import { collectionItems, games, user } from "@/server/db/schema";
import { setupTestDatabase, testDb } from "@/test/database";
import { createLibraryFilters } from "@/utils/libraryFilters";

/**
 * Builds a catalog row, marking it as an expansion when it lists parents.
 *
 * @param bggId - BoardGameGeek identifier, which also derives the row id.
 * @param name - Game title.
 * @param expandsBggIds - Parent BGG ids for an expansion, or null for a base game.
 * @returns A row accepted by the games table.
 */
function catalogGame(
  bggId: number,
  name: string,
  expandsBggIds: number[] | null = null,
) {
  return {
    bggId,
    expandsBggIds: expandsBggIds ?? [],
    id: `00000000-0000-4000-8000-${String(bggId).padStart(12, "0")}`,
    isExpansion: expandsBggIds !== null,
    maxPlayers: 4,
    minPlayers: 1,
    name,
  };
}

const catalog = [
  catalogGame(1, "Azul"),
  catalogGame(2, "Brass"),
  catalogGame(3, "Catan"),
  catalogGame(4, "Catan: Seafarers", [3]),
  catalogGame(5, "Brass: Pottery", []),
  catalogGame(6, "Orphan Pack", [99]),
  catalogGame(7, "Zoo 100%"),
  catalogGame(8, "Other's Game"),
];

/**
 * Builds a collection request from default filters.
 *
 * @param window - Filter overrides and result window.
 * @param window.filters - Overrides applied to the default filter state.
 * @param window.limit - Root entries requested.
 * @param window.offset - Root entries skipped.
 * @returns A validated-shape request for the owned collection.
 */
function request({
  filters = {},
  limit = 48,
  offset = 0,
}: {
  filters?: Partial<LibraryFilters>;
  limit?: number;
  offset?: number;
} = {}): LibraryPageRequest {
  return {
    filters: { ...createLibraryFilters(), ...filters },
    limit,
    location: "collection",
    offset,
  };
}

/**
 * Loads a page and reduces its cards to their names.
 *
 * @param userId - Account whose library is read.
 * @param pageRequest - Filters and window to load.
 * @returns Card names in the order returned.
 */
async function namesFor(
  userId: string,
  pageRequest: LibraryPageRequest,
): Promise<string[]> {
  const page = await getLibraryPage(userId, pageRequest);
  return page.games.map((game) => game.name);
}

setupTestDatabase();
beforeEach(async () => {
  await testDb.delete(user);
  await testDb.delete(games);
  await testDb.insert(user).values([
    { id: "owner", name: "Owner", email: "owner@example.com" },
    { id: "other", name: "Other", email: "other@example.com" },
  ]);
  await testDb.insert(games).values(catalog);
  await testDb
    .insert(collectionItems)
    .values([
      ...catalog
        .filter((game) => game.bggId !== 8)
        .map((game) => ({ gameId: game.id, userId: "owner" })),
      { gameId: catalogGame(1, "Azul").id, userId: "other" },
      { gameId: catalogGame(8, "Other's Game").id, userId: "other" },
    ]);
});

describe("getLibraryPage", () => {
  it("pages base games with the expansions linked to the visible ones", async () => {
    const page = await getLibraryPage("owner", request({ limit: 2 }));

    expect(page.games.map((game) => game.name)).toEqual([
      "Azul",
      "Brass",
      "Brass: Pottery",
    ]);
    expect(page).toMatchObject({
      baseGameCount: 4,
      expansionCount: 3,
      nextOffset: 2,
      total: 5,
    });
  });

  it("lists expansions without a matching base game once base games run out", async () => {
    const page = await getLibraryPage(
      "owner",
      request({ limit: 3, offset: 2 }),
    );

    expect(page.games.map((game) => game.name)).toEqual([
      "Catan",
      "Zoo 100%",
      "Catan: Seafarers",
      "Orphan Pack",
    ]);
    expect(page.nextOffset).toBe(5);
  });

  it("shows an expansion on its own when the search hides its base game", async () => {
    expect(
      await namesFor("owner", request({ filters: { query: "seafarers" } })),
    ).toEqual(["Catan: Seafarers"]);
  });

  it("matches wildcard characters in a search literally", async () => {
    expect(
      await namesFor("owner", request({ filters: { query: "%" } })),
    ).toEqual(["Zoo 100%"]);
    expect(
      await namesFor("owner", request({ filters: { query: "_" } })),
    ).toEqual([]);
  });

  it("pages a single game type as a flat list", async () => {
    expect(
      await namesFor("owner", request({ filters: { gameType: "expansions" } })),
    ).toEqual(["Brass: Pottery", "Catan: Seafarers", "Orphan Pack"]);
  });

  it("never returns another account's games", async () => {
    expect(await namesFor("other", request())).toEqual([
      "Azul",
      "Other's Game",
    ]);
  });
});
