import { z } from "zod";

import { bggImageUrlSchema } from "@/core/shared/shared.contract";

/** Validates a collection-item identifier. */
export const itemIdSchema = z.uuid();

/** Converts a form checkbox value into a boolean. */
export const giftedSchema = z
  .enum(["true", "false"])
  .nullish()
  .transform((value) => value === "true");

/**
 * Creates a nullable, coerced integer contract within inclusive bounds.
 *
 * @param minimum - Smallest accepted numeric value.
 * @param maximum - Largest accepted numeric value.
 * @returns A schema that accepts a bounded optional integer.
 */
export function optionalInteger(
  minimum: number,
  maximum: number,
): z.ZodType<number | null, unknown> {
  return z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().int().min(minimum).max(maximum).nullable(),
  );
}

/** Validates editable metadata supplied while adding a game. */
export const gameDetailsSchema = z
  .object({
    categories: z.string().trim().max(500),
    families: z.string().trim().max(1_000),
    description: z.string().trim().max(2_000),
    imageUrl: z.preprocess(
      (value) => (value === "" || value === null ? null : value),
      bggImageUrlSchema.nullable(),
    ),
    maxPlayers: z.coerce.number().int().min(1).max(99),
    maxPlaytime: z.coerce.number().int().min(1).max(10_000),
    mechanics: z.string().trim().max(1_000),
    minPlayers: z.coerce.number().int().min(1).max(99),
    minPlaytime: z.coerce.number().int().min(0).max(10_000),
    moneySpent: z.coerce.number().min(0).max(999_999_999.99),
    gifted: giftedSchema,
    weight: z.preprocess(
      (value) => (value === "" || value === null ? null : value),
      z.coerce.number().min(1).max(5).nullable(),
    ),
    yearPublished: optionalInteger(1800, 2200),
  })
  .refine((game) => game.maxPlayers >= game.minPlayers, {
    message: "Maximum players cannot be lower than minimum players.",
  })
  .refine((game) => game.maxPlaytime >= game.minPlaytime, {
    message: "Maximum duration cannot be lower than minimum duration.",
  })
  .transform((game) => ({
    ...game,
    moneySpent: game.gifted ? 0 : game.moneySpent,
  }));

/** Validates user-owned collection fields. */
export const editCollectionItemSchema = z
  .object({
    gifted: giftedSchema,
    itemId: itemIdSchema,
    moneySpent: z.coerce.number().min(0).max(999_999_999.99),
    notes: z.string().trim().max(4_000),
    personalRating: z.preprocess(
      (value) => (value === "" || value === null ? null : value),
      z.coerce.number().min(0).max(10).nullable(),
    ),
  })
  .transform((item) => ({
    ...item,
    moneySpent: item.gifted ? 0 : item.moneySpent,
  }));

/** Validates the collection destination selected by the user. */
export const libraryDestinationSchema = z.enum(["collection", "wishlist"]);
