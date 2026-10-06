import { describe, expect, it } from "vitest";

import type { LibraryFilters, LibraryPage } from "@/core";
import { createCollectionGame } from "@/test/collectionGame";
import { createLibraryFilters } from "@/utils/libraryFilters";
import { paginateLibraryGames } from "@/utils/libraryPages";

const library = [
  createCollectionGame({ bggId: 3, name: "Catan" }),
  createCollectionGame({ bggId: 1, name: "Azul" }),
  createCollectionGame({
    bggId: 4,
    expandsBggIds: [3],
    isExpansion: true,
    name: "Catan: Seafarers",
  }),
  createCollectionGame({ bggId: 2, name: "Brass" }),
  createCollectionGame({
    bggId: 9,
    expandsBggIds: [99],
    isExpansion: true,
    name: "Orphan Pack",
  }),
];

/**
 * Pages the sample library and reduces its cards to their names.
 *
 * @param offset - Root entries skipped before the window.
 * @param limit - Root entries in the window.
 * @param filters - Overrides applied to the default filter state.
 * @returns The page with card names in place of cards.
 */
function namesAt(
  offset: number,
  limit: number,
  filters: Partial<LibraryFilters> = {},
): Omit<LibraryPage, "games"> & { games: string[] } {
  const page = paginateLibraryGames(
    library,
    { filters: { ...createLibraryFilters(), ...filters }, limit, offset },
    "en",
  );
  return { ...page, games: page.games.map((game) => game.name) };
}

describe("paginateLibraryGames", () => {
  it("counts a base game and its expansions as one entry", () => {
    expect(namesAt(2, 1)).toEqual({
      baseGameCount: 3,
      expansionCount: 2,
      games: ["Catan", "Catan: Seafarers"],
      nextOffset: 3,
      total: 4,
    });
  });

  it("lists expansions without a parent only after every base game", () => {
    expect(namesAt(0, 3).games).toEqual([
      "Azul",
      "Brass",
      "Catan",
      "Catan: Seafarers",
    ]);
    expect(namesAt(3, 3)).toMatchObject({
      games: ["Orphan Pack"],
      nextOffset: 4,
    });
  });

  it("pages a single game type as a flat list", () => {
    expect(namesAt(0, 10, { gameType: "expansions" })).toEqual({
      baseGameCount: 0,
      expansionCount: 2,
      games: ["Catan: Seafarers", "Orphan Pack"],
      nextOffset: 2,
      total: 2,
    });
  });

  it("returns an empty window past the last entry", () => {
    expect(namesAt(10, 5)).toMatchObject({ games: [], nextOffset: 10 });
  });
});
