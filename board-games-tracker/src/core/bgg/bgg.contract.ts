import { z } from "zod";

import {
  bggIdSchema,
  bggImageUrlSchema,
  gameNameSchema,
  labelSchema,
  yearPublishedSchema,
} from "@/core/shared/shared.contract";

/**
 * Validates normalized metadata scraped from BoardGameGeek's public sources.
 *
 * Bounds match what the scraper may emit, so this is also what the browser
 * checks the metadata route against. Player counts and play times are checked
 * field by field, never against each other: a half-readable page can give a
 * maximum below the minimum, and rejecting the record over that would lose
 * metadata the add form can still use.
 */
export const bggMetadataSchema = z.object({
  bggId: bggIdSchema,
  bggRating: z.number().min(0).max(10).nullable(),
  categories: z.array(labelSchema).max(50),
  description: z.string().max(10_000),
  expandsBggIds: z.array(bggIdSchema).max(200),
  expansionBggIds: z.array(bggIdSchema).max(200),
  families: z.array(labelSchema).max(50),
  imageUrl: bggImageUrlSchema.nullable(),
  isExpansion: z.boolean(),
  maxPlayers: z.number().int().min(1).max(99),
  maxPlaytime: z.number().int().min(0).max(10_000),
  mechanics: z.array(labelSchema).max(50),
  minPlayers: z.number().int().min(1).max(99),
  minPlaytime: z.number().int().min(0).max(10_000),
  name: gameNameSchema,
  weight: z.number().min(1).max(5).nullable(),
  yearPublished: yearPublishedSchema.nullable(),
});

/** Normalized metadata parsed from BoardGameGeek. */
export type BggMetadata = z.infer<typeof bggMetadataSchema>;
