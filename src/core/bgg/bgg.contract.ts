import { z } from "zod";

import { bggImageUrlSchema, labelSchema } from "@/core/shared/shared.contract";

/** Validates a BoardGameGeek object identifier. */
const bggObjectIdSchema = z.number().int().min(1).max(10_000_000);

/**
 * Validates normalized metadata scraped from BoardGameGeek's public sources.
 *
 * Bounds match what the scraper is allowed to emit, so the same schema serves
 * as the browser's check on the metadata route. Player counts and play times
 * are validated field by field rather than against each other: a partially
 * readable page legitimately yields a maximum below the minimum, and dropping
 * the whole record over it would lose metadata the add form can still use.
 */
export const bggMetadataSchema = z.object({
  bggId: bggObjectIdSchema,
  bggRating: z.number().min(0).max(10).nullable(),
  categories: z.array(labelSchema).max(50),
  description: z.string().max(10_000),
  expandsBggIds: z.array(bggObjectIdSchema).max(200),
  expansionBggIds: z.array(bggObjectIdSchema).max(200),
  families: z.array(labelSchema).max(50),
  imageUrl: bggImageUrlSchema.nullable(),
  isExpansion: z.boolean(),
  maxPlayers: z.number().int().min(1).max(99),
  maxPlaytime: z.number().int().min(0).max(10_000),
  mechanics: z.array(labelSchema).max(50),
  minPlayers: z.number().int().min(1).max(99),
  minPlaytime: z.number().int().min(0).max(10_000),
  name: z.string().trim().min(1).max(160),
  weight: z.number().min(1).max(5).nullable(),
  yearPublished: z.number().int().min(1800).max(2200).nullable(),
});

/** Normalized metadata parsed from BoardGameGeek. */
export type BggMetadata = z.infer<typeof bggMetadataSchema>;
