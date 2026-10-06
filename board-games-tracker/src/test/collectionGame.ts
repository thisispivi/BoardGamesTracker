import type { CollectionGame } from "@/core";

/**
 * Builds a collection card with neutral metadata for tests.
 *
 * @param overrides - Fields that distinguish the card; its BGG id also derives the default identifiers.
 * @returns A complete card.
 */
export function createCollectionGame(
  overrides: Partial<CollectionGame> & Pick<CollectionGame, "bggId" | "name">,
): CollectionGame {
  return {
    id: `item-${overrides.bggId}`,
    favorite: false,
    hasPlayed: false,
    personalRating: null,
    notes: "",
    moneySpent: 0,
    gifted: false,
    gameId: `game-${overrides.bggId}`,
    imageUrl: null,
    thumbnailUrl: null,
    yearPublished: null,
    minPlayers: 1,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 60,
    weight: null,
    bggRating: null,
    isExpansion: false,
    expandsBggIds: [],
    expansionBggIds: [],
    categories: [],
    mechanics: [],
    families: [],
    ...overrides,
  };
}
