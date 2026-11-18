import { describe, expect, it } from "vitest";

import type { CollectionGame } from "@/core";
import { groupCollection } from "@/utils/collectionGrouping";

/**
 * Builds one complete collection record for grouping tests.
 *
 * @param values - Identity and relationship fields that differ per fixture.
 * @returns A collection game with neutral personal and taxonomy metadata.
 */
function collectionGame(
  values: Pick<
    CollectionGame,
    | "bggId"
    | "expandsBggIds"
    | "expansionBggIds"
    | "id"
    | "isExpansion"
    | "name"
  >,
): CollectionGame {
  return {
    ...values,
    bggRating: null,
    categories: [],
    families: [],
    favorite: false,
    gameId: values.id,
    gifted: false,
    hasPlayed: false,
    imageUrl: null,
    maxPlayers: 4,
    maxPlaytime: 60,
    mechanics: [],
    minPlayers: 2,
    minPlaytime: 30,
    moneySpent: 0,
    notes: "",
    personalRating: null,
    thumbnailUrl: null,
    weight: null,
    yearPublished: null,
  };
}

describe("groupCollection", () => {
  it("uses a base game's BGG expansion list across localized titles", () => {
    const base = collectionGame({
      bggId: 154_880,
      expandsBggIds: [],
      expansionBggIds: [191_182],
      id: "voodoo",
      isExpansion: false,
      name: "Voodoo",
    });
    const expansion = collectionGame({
      bggId: 191_182,
      expandsBggIds: [],
      expansionBggIds: [],
      id: "double-trouble",
      isExpansion: true,
      name: "Vudù: Double Trouble",
    });

    expect(groupCollection([base, expansion])).toEqual({
      groups: [{ base, expansions: [expansion] }],
      ungrouped: [],
    });
  });

  it("prefers an expansion's exact BGG parent over a misleading title", () => {
    const bggParent = collectionGame({
      bggId: 154_880,
      expandsBggIds: [],
      expansionBggIds: [],
      id: "voodoo",
      isExpansion: false,
      name: "Voodoo",
    });
    const titleMatch = collectionGame({
      bggId: 999_999,
      expandsBggIds: [],
      expansionBggIds: [],
      id: "vudu",
      isExpansion: false,
      name: "Vudù",
    });
    const expansion = collectionGame({
      bggId: 191_182,
      expandsBggIds: [154_880],
      expansionBggIds: [],
      id: "double-trouble",
      isExpansion: true,
      name: "Vudù: Double Trouble",
    });

    const grouped = groupCollection([bggParent, titleMatch, expansion]);

    expect(grouped.groups).toEqual([
      { base: bggParent, expansions: [expansion] },
      { base: titleMatch, expansions: [] },
    ]);
  });

  it("retains normalized title matching when BGG links are unavailable", () => {
    const base = collectionGame({
      bggId: 92_009,
      expandsBggIds: [],
      expansionBggIds: [],
      id: "ticket-to-ride",
      isExpansion: false,
      name: "Ticket to Ride",
    });
    const expansion = collectionGame({
      bggId: 53_383,
      expandsBggIds: [],
      expansionBggIds: [],
      id: "europa-1912",
      isExpansion: true,
      name: "Ticket to Ride: Europa 1912",
    });

    expect(groupCollection([base, expansion]).groups[0]?.expansions).toEqual([
      expansion,
    ]);
  });
});
