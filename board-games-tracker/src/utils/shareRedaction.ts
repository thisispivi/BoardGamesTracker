import type { CollectionGame } from "@/core";

/**
 * Strips the personal fields that are never part of a shared library.
 *
 * Notes and personal ratings are private regardless of what the owner shares,
 * and prices are included only when the owner opted in. Redaction happens here
 * rather than in the page so an anonymous visitor cannot recover a value by
 * reading the serialized server response.
 *
 * @param games - The owner's library entries.
 * @param includePrices - Whether the owner shares what they paid.
 * @returns Entries safe to serialize to an anonymous visitor.
 */
export function redactSharedGames(
  games: readonly CollectionGame[],
  includePrices: boolean,
): CollectionGame[] {
  return games.map((game) => ({
    ...game,
    gifted: includePrices ? game.gifted : false,
    hasPlayed: false,
    moneySpent: includePrices ? game.moneySpent : 0,
    notes: "",
    personalRating: null,
  }));
}
