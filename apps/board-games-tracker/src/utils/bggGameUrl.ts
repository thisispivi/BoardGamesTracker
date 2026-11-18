/**
 * Builds the canonical BoardGameGeek page address for a game.
 *
 * @param bggId - Validated BoardGameGeek identifier.
 * @returns The `https://boardgamegeek.com/boardgame/<id>` page URL.
 */
export function getBggGameUrl(bggId: number): string {
  return `https://boardgamegeek.com/boardgame/${bggId}`;
}
