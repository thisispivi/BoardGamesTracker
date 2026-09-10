import { z } from "zod";

import { libraryDestinationSchema } from "@/core/collection/collection.contract";

/** Root cards requested per scroll step; divisible by every grid column count so rows stay full. */
export const libraryPageSize = 48;

/** Largest root window one request may load, which also bounds a reload after a mutation. */
export const libraryPageMaxLimit = 1_000;

/** Longest text accepted in one serialized card field. */
const maxCardText = 4_000;

/** Most entries accepted in one serialized card list field. */
const maxCardList = 1_000;

/** Validates a three-state Boolean library facet. */
export const libraryBooleanFilterSchema = z.enum(["all", "yes", "no"]);

/** Validates which kinds of games a library page includes. */
export const libraryGameTypeSchema = z.enum(["all", "baseGames", "expansions"]);

/** Validates the ordering applied to a library page. */
export const librarySortSchema = z.enum([
  "nameAscending",
  "nameDescending",
  "weightAscending",
  "weightDescending",
  "timeAscending",
  "timeDescending",
]);

/** Validates a complexity facet supported by the collection filters. */
export const libraryWeightFilterSchema = z.enum([
  "all",
  "light",
  "medium",
  "heavy",
  "veryHeavy",
]);

/** Validates an inclusive non-negative range used by sliders. */
export const numberRangeSchema = z
  .strictObject({
    max: z.number().int().min(0).max(10_000),
    min: z.number().int().min(0).max(10_000),
  })
  .refine((range) => range.max >= range.min);

/** Validates the complete filter state sent to paginated library queries. */
export const libraryFiltersSchema = z.strictObject({
  categories: z.array(z.string().trim().min(1).max(160)).max(100),
  favoriteFilter: libraryBooleanFilterSchema,
  gameType: libraryGameTypeSchema,
  mechanics: z.array(z.string().trim().min(1).max(160)).max(100),
  playedFilter: libraryBooleanFilterSchema,
  players: numberRangeSchema,
  playtime: numberRangeSchema,
  query: z.string().trim().max(200),
  sort: librarySortSchema,
  weight: libraryWeightFilterSchema,
});

/**
 * Validates a request for one window of a private library.
 *
 * The object is strict, so a request naming an account or any other field is
 * rejected instead of silently trimmed; the account always comes from the session.
 */
export const libraryPageRequestSchema = z.strictObject({
  filters: libraryFiltersSchema,
  limit: z.number().int().min(1).max(libraryPageMaxLimit),
  location: libraryDestinationSchema,
  offset: z.number().int().min(0).max(1_000_000),
});

/** Validates one serialized collection or wishlist card. */
export const collectionGameSchema = z.object({
  id: z.string().max(64),
  favorite: z.boolean(),
  hasPlayed: z.boolean(),
  personalRating: z.number().nullable(),
  notes: z.string().max(maxCardText),
  moneySpent: z.number(),
  gifted: z.boolean(),
  gameId: z.string().max(64),
  bggId: z.number().int(),
  name: z.string().max(maxCardText),
  imageUrl: z.string().max(maxCardText).nullable(),
  thumbnailUrl: z.string().max(maxCardText).nullable(),
  yearPublished: z.number().int().nullable(),
  minPlayers: z.number().int(),
  maxPlayers: z.number().int(),
  minPlaytime: z.number().int(),
  maxPlaytime: z.number().int(),
  weight: z.number().nullable(),
  bggRating: z.number().nullable(),
  isExpansion: z.boolean(),
  expandsBggIds: z.array(z.number().int()).max(maxCardList),
  expansionBggIds: z.array(z.number().int()).max(maxCardList),
  categories: z.array(z.string().max(maxCardText)).max(maxCardList),
  mechanics: z.array(z.string().max(maxCardText)).max(maxCardList),
  families: z.array(z.string().max(maxCardText)).max(maxCardList),
});

/**
 * Validates one window of library cards and the counts describing the whole view.
 *
 * `total` and `nextOffset` count root entries — base games and expansions shown
 * on their own — so expansions grouped beneath a base game never shift the cursor.
 */
export const libraryPageSchema = z.object({
  baseGameCount: z.number().int().min(0),
  expansionCount: z.number().int().min(0),
  games: z.array(collectionGameSchema).max(10_000),
  nextOffset: z.number().int().min(0),
  total: z.number().int().min(0),
});

/** Three-state choice used by Boolean library facets. */
export type LibraryBooleanFilter = z.infer<typeof libraryBooleanFilterSchema>;

/** Game kinds available to the shared library browser. */
export type LibraryGameType = z.infer<typeof libraryGameTypeSchema>;

/** Stable sort choices shared by collection and wishlist browsing. */
export type LibrarySort = z.infer<typeof librarySortSchema>;

/** Complexity bands accepted by the library filter. */
export type LibraryWeightFilter = z.infer<typeof libraryWeightFilterSchema>;

/** Inclusive numeric range controlled by a paired slider. */
export type NumberRange = z.infer<typeof numberRangeSchema>;

/** Search, facet, and ordering state shared by every game browsing surface. */
export type LibraryFilters = z.infer<typeof libraryFiltersSchema>;

/** Private library section and result window requested by infinite scrolling. */
export type LibraryPageRequest = z.infer<typeof libraryPageRequestSchema>;

/** Filter state and result window, independent of where the cards come from. */
export type LibraryPageQuery = Omit<LibraryPageRequest, "location">;

/** Serialized collection game rendered by the browser. */
export type CollectionGame = z.infer<typeof collectionGameSchema>;

/** One window of library cards and the counts describing the whole view. */
export type LibraryPage = z.infer<typeof libraryPageSchema>;
