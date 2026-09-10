import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  lte,
  notExists,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import type {
  CollectionGame,
  LibraryFacetGame,
  LibraryFilters,
  LibraryPage,
  LibraryPageRequest,
  LibrarySort,
} from "@/core";
import { db } from "@/server/db";
import { collectionItems, games } from "@/server/db/schema";
import {
  isFullRange,
  playerRangeBounds,
  playtimeRangeBounds,
} from "@/utils/libraryFilters";

/** Private library section a query is scoped to. */
type LibraryLocation = LibraryPageRequest["location"];

/** Most words of one search query matched independently. */
const maxSearchTerms = 8;

/** Most expansions attached beneath the base games of one page. */
const maxAttachedExpansions = 2_000;

/** Columns required to render one collection or wishlist card. */
const librarySelection = {
  id: collectionItems.id,
  favorite: collectionItems.favorite,
  hasPlayed: collectionItems.hasPlayed,
  personalRating: collectionItems.personalRating,
  notes: collectionItems.notes,
  moneySpent: collectionItems.moneySpent,
  gifted: collectionItems.gifted,
  gameId: games.id,
  bggId: games.bggId,
  name: games.name,
  imageUrl: games.imageUrl,
  thumbnailUrl: games.thumbnailUrl,
  imageChecksum: games.imageChecksum,
  yearPublished: games.yearPublished,
  minPlayers: games.minPlayers,
  maxPlayers: games.maxPlayers,
  minPlaytime: games.minPlaytime,
  maxPlaytime: games.maxPlaytime,
  weight: games.weight,
  bggRating: games.bggRating,
  isExpansion: games.isExpansion,
  expandsBggIds: games.expandsBggIds,
  expansionBggIds: games.expansionBggIds,
  categories: games.categories,
  mechanics: games.mechanics,
  families: games.families,
};

/** Database row returned by the shared card selection. */
type LibraryRow = CollectionGame & { imageChecksum: string | null };

/**
 * Replaces a stored artwork checksum with its same-origin cache URL.
 *
 * @param row - Card columns selected together with the artwork checksum.
 * @returns The serializable card, pointing at cached artwork when it exists.
 */
function normalizeLibraryRow(row: LibraryRow): CollectionGame {
  const { imageChecksum, ...game } = row;
  const cachedUrl = imageChecksum ? `/api/game-images/${imageChecksum}` : null;
  return {
    ...game,
    imageUrl: cachedUrl ?? game.imageUrl,
    thumbnailUrl: cachedUrl ?? game.thumbnailUrl,
  };
}

/**
 * Restricts a query to one library section of one account.
 *
 * @param userId - Account whose items may be returned.
 * @param location - Library section being browsed.
 * @returns The ownership predicate every library query starts from.
 */
function locationCondition(userId: string, location: LibraryLocation): SQL {
  return (
    and(
      eq(collectionItems.userId, userId),
      location === "collection"
        ? eq(collectionItems.owned, true)
        : eq(collectionItems.wishlist, true),
    ) ?? sql`false`
  );
}

/**
 * Escapes LIKE wildcards so user text only ever matches literally.
 *
 * @param value - Untrusted search text.
 * @returns The text with backslash, percent, and underscore escaped for PostgreSQL.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/**
 * Binds untrusted strings as a PostgreSQL text array.
 *
 * @param values - Taxonomy values selected in the filter panel.
 * @returns A parameterized text array expression.
 */
function textArray(values: string[]): SQL {
  return sql`array[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

/**
 * Translates the filter panel into parameterized predicates.
 *
 * The rules match the in-memory filters used by the picker and shared links:
 * a full-width range excludes nothing, unrated games fall outside every
 * complexity band, and each search word must match the title or taxonomy.
 *
 * @param filters - Validated filter state.
 * @returns Predicates that every returned card satisfies.
 */
function filterConditions(filters: LibraryFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.favoriteFilter !== "all") {
    conditions.push(
      eq(collectionItems.favorite, filters.favoriteFilter === "yes"),
    );
  }
  if (filters.playedFilter !== "all") {
    conditions.push(
      eq(collectionItems.hasPlayed, filters.playedFilter === "yes"),
    );
  }
  if (!isFullRange(filters.players, playerRangeBounds)) {
    conditions.push(
      lte(games.minPlayers, filters.players.max),
      gte(games.maxPlayers, filters.players.min),
    );
  }
  if (!isFullRange(filters.playtime, playtimeRangeBounds)) {
    conditions.push(
      gt(games.maxPlaytime, 0),
      gte(games.maxPlaytime, filters.playtime.min),
      lte(games.maxPlaytime, filters.playtime.max),
    );
  }
  if (filters.weight === "light") {
    conditions.push(lte(games.weight, 2));
  } else if (filters.weight === "medium") {
    conditions.push(gt(games.weight, 2), lte(games.weight, 3));
  } else if (filters.weight === "heavy") {
    conditions.push(gt(games.weight, 3), lte(games.weight, 4));
  } else if (filters.weight === "veryHeavy") {
    conditions.push(gt(games.weight, 4));
  }
  if (filters.categories.length > 0) {
    conditions.push(
      sql`${games.categories} ?| ${textArray(filters.categories)}`,
    );
  }
  if (filters.mechanics.length > 0) {
    conditions.push(sql`${games.mechanics} ?| ${textArray(filters.mechanics)}`);
  }
  const terms = filters.query.split(/\s+/).filter(Boolean);
  for (const term of terms.slice(0, maxSearchTerms)) {
    const pattern = `%${escapeLikePattern(term)}%`;
    conditions.push(
      or(
        ilike(games.name, pattern),
        sql`${games.categories}::text ilike ${pattern}`,
        sql`${games.mechanics}::text ilike ${pattern}`,
        sql`${games.families}::text ilike ${pattern}`,
      ) ?? sql`false`,
    );
  }
  return conditions;
}

/**
 * Orders cards as requested, ending in a unique key so offsets never skip or repeat one.
 *
 * @param sort - Ordering chosen in the filter panel.
 * @returns Sort expressions with unknown metrics placed last.
 */
function libraryOrder(sort: LibrarySort): SQL[] {
  const tiebreak = [asc(games.name), asc(collectionItems.id)];
  if (sort === "nameDescending") {
    return [desc(games.name), asc(collectionItems.id)];
  }
  if (sort === "weightAscending") {
    return [sql`${games.weight} asc nulls last`, ...tiebreak];
  }
  if (sort === "weightDescending") {
    return [sql`${games.weight} desc nulls last`, ...tiebreak];
  }
  if (sort === "timeAscending") {
    return [sql`nullif(${games.maxPlaytime}, 0) asc nulls last`, ...tiebreak];
  }
  if (sort === "timeDescending") {
    return [sql`nullif(${games.maxPlaytime}, 0) desc nulls last`, ...tiebreak];
  }
  return tiebreak;
}

/**
 * Loads one window of cards matching a predicate.
 *
 * @param where - Ownership, facet, and game-kind predicate.
 * @param order - Sort expressions ending in a unique key.
 * @param limit - Most cards returned.
 * @param offset - Cards skipped before the window.
 * @returns Normalized cards in the requested order.
 */
async function selectCards(
  where: SQL | undefined,
  order: SQL[],
  limit: number,
  offset: number,
): Promise<CollectionGame[]> {
  const rows = await db
    .select(librarySelection)
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(where)
    .orderBy(...order)
    .limit(limit)
    .offset(offset);
  return rows.map(normalizeLibraryRow);
}

/**
 * Selects the identity of the base games matching a predicate as a derived table.
 *
 * @param where - Predicate over the collection items and games of the base rows.
 * @returns A table an expansion query can search for a parent.
 */
function baseGameTable(where: SQL | undefined) {
  return db
    .select({
      bggId: games.bggId,
      expansionBggIds: games.expansionBggIds,
      name: games.name,
    })
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(where)
    .as("base_games");
}

/**
 * Matches the expansion of the enclosing query to a row of a base-game table.
 *
 * Follows the grouping the browser applies: a BoardGameGeek link in either
 * direction, or an expansion title that continues the base title after a colon
 * or a space.
 *
 * @param base - Derived base-game table compared with the enclosing expansion.
 * @returns A predicate that holds when the expansion belongs to a row of the table.
 */
function expandsBaseGame(base: ReturnType<typeof baseGameTable>): SQL {
  const literalBaseName = sql`replace(replace(replace(${base.name}, ${"\\"}, ${"\\\\"}), ${"%"}, ${"\\%"}), ${"_"}, ${"\\_"})`;
  return (
    or(
      sql`${base.bggId} = any(${games.expandsBggIds})`,
      sql`${games.bggId} = any(${base.expansionBggIds})`,
      sql`${games.name} ilike (${literalBaseName} || ${":%"})`,
      sql`${games.name} ilike (${literalBaseName} || ${" %"})`,
    ) ?? sql`false`
  );
}

/**
 * Fetches one user library location with normalized game metadata.
 *
 * @param userId - The authenticated user identifier.
 * @param location - Library section used to constrain the collection query.
 * @returns Games in the requested library section, ordered by name.
 */
async function getLibraryItems(
  userId: string,
  location: LibraryLocation,
): Promise<CollectionGame[]> {
  const rows = await db
    .select(librarySelection)
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(locationCondition(userId, location))
    .orderBy(asc(games.name));
  return rows.map(normalizeLibraryRow);
}

/**
 * Fetches lightweight taxonomy data without loading every card into the browser.
 *
 * @param userId - The authenticated user identifier.
 * @param location - Private library section whose available facets are collected.
 * @returns Category and mechanic arrays used to construct stable filter choices.
 */
export async function getLibraryFacetGames(
  userId: string,
  location: LibraryLocation,
): Promise<LibraryFacetGame[]> {
  return db
    .select({
      categories: games.categories,
      isExpansion: games.isExpansion,
      mechanics: games.mechanics,
    })
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(locationCondition(userId, location));
}

/**
 * Fetches one filtered window of a private library.
 *
 * The wishlist and any single game type page as a flat list. The collection
 * with every game type pages its base games, attaches the matching expansions
 * linked to the base games in the window, and once the base games run out
 * pages the matching expansions that belong to no matching base game. Only
 * base games and those unmatched expansions advance the cursor.
 *
 * @param userId - Authenticated account whose items are read.
 * @param request - Validated filter state, library section, and result window.
 * @returns The window's cards, the counts for the whole view, and the next cursor.
 */
export async function getLibraryPage(
  userId: string,
  request: LibraryPageRequest,
): Promise<LibraryPage> {
  const { filters, limit, location, offset } = request;
  const matching = and(
    locationCondition(userId, location),
    ...filterConditions(filters),
  );
  const gameTypeCondition =
    filters.gameType === "all"
      ? undefined
      : eq(games.isExpansion, filters.gameType === "expansions");
  const order = libraryOrder(filters.sort);
  const [counts] = await db
    .select({
      baseGames:
        sql<number>`count(*) filter (where not ${games.isExpansion})`.mapWith(
          Number,
        ),
      expansions:
        sql<number>`count(*) filter (where ${games.isExpansion})`.mapWith(
          Number,
        ),
    })
    .from(collectionItems)
    .innerJoin(games, eq(collectionItems.gameId, games.id))
    .where(and(matching, gameTypeCondition));
  const baseGameCount = counts?.baseGames ?? 0;
  const expansionCount = counts?.expansions ?? 0;

  if (location === "wishlist" || filters.gameType !== "all") {
    const cards = await selectCards(
      and(matching, gameTypeCondition),
      order,
      limit,
      offset,
    );
    return {
      baseGameCount,
      expansionCount,
      games: cards,
      nextOffset: offset + cards.length,
      total: baseGameCount + expansionCount,
    };
  }

  const matchingBases = baseGameTable(
    and(matching, eq(games.isExpansion, false)),
  );
  const unmatchedExpansion = and(
    matching,
    eq(games.isExpansion, true),
    notExists(
      db
        .select({ found: sql`1` })
        .from(matchingBases)
        .where(expandsBaseGame(matchingBases)),
    ),
  );
  const [bases, [unmatchedCount]] = await Promise.all([
    offset < baseGameCount
      ? selectCards(
          and(matching, eq(games.isExpansion, false)),
          order,
          limit,
          offset,
        )
      : Promise.resolve([]),
    db
      .select({ value: count() })
      .from(collectionItems)
      .innerJoin(games, eq(collectionItems.gameId, games.id))
      .where(unmatchedExpansion),
  ]);
  const remaining = limit - bases.length;
  const visibleBases = baseGameTable(
    and(
      eq(collectionItems.userId, userId),
      inArray(
        collectionItems.id,
        bases.map((game) => game.id),
      ),
    ),
  );
  const [attached, unmatched] = await Promise.all([
    bases.length > 0
      ? selectCards(
          and(
            matching,
            eq(games.isExpansion, true),
            exists(
              db
                .select({ found: sql`1` })
                .from(visibleBases)
                .where(expandsBaseGame(visibleBases)),
            ),
          ),
          [asc(games.name), asc(collectionItems.id)],
          maxAttachedExpansions,
          0,
        )
      : Promise.resolve([]),
    remaining > 0
      ? selectCards(
          unmatchedExpansion,
          order,
          remaining,
          Math.max(0, offset - baseGameCount),
        )
      : Promise.resolve([]),
  ]);

  return {
    baseGameCount,
    expansionCount,
    games: [...bases, ...attached, ...unmatched],
    nextOffset: offset + bases.length + unmatched.length,
    total: baseGameCount + (unmatchedCount?.value ?? 0),
  };
}

/**
 * Fetches a user's owned board-game collection.
 *
 * @param userId - The authenticated user identifier.
 * @returns Owned games with their personal metadata.
 */
export function getCollection(userId: string): Promise<CollectionGame[]> {
  return getLibraryItems(userId, "collection");
}

/**
 * Fetches a user's games saved for a future purchase.
 *
 * @param userId - The authenticated user identifier.
 * @returns Wishlist games with their personal metadata.
 */
export function getWishlist(userId: string): Promise<CollectionGame[]> {
  return getLibraryItems(userId, "wishlist");
}
