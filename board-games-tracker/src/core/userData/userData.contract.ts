import { z } from "zod";

import {
  bggIdSchema,
  bggImageUrlSchema,
  gameNameSchema,
  labelSchema,
  moneySpentSchema,
  refineGameRanges,
  yearPublishedSchema,
} from "@/core/shared/shared.contract";

/** Validates a supported user-data import or export format. */
export const userDataFormatSchema = z.enum(["json", "csv", "xlsx", "sql"]);

/** One portable owned or wished-for board-game record. */
export const portableGameSchema = z
  .object({
    location: z.enum(["collection", "wishlist"]),
    bggId: bggIdSchema,
    name: gameNameSchema,
    description: z.string().max(20_000),
    imageUrl: bggImageUrlSchema.nullable(),
    yearPublished: yearPublishedSchema.nullable(),
    minPlayers: z.number().int().min(1).max(99),
    maxPlayers: z.number().int().min(1).max(99),
    minPlaytime: z.number().int().min(0).max(10_000),
    maxPlaytime: z.number().int().min(0).max(10_000),
    weight: z
      .union([z.literal(0), z.number().min(1).max(5)])
      .nullable()
      .transform((value) => (value === 0 ? null : value)),
    bggRating: z.number().min(0).max(10).nullable(),
    isExpansion: z.boolean(),
    categories: z.array(labelSchema).max(50),
    mechanics: z.array(labelSchema).max(50),
    families: z.array(labelSchema).max(50),
    favorite: z.boolean(),
    personalRating: z.number().min(0).max(10).nullable(),
    notes: z.string().max(4_000),
    moneySpent: moneySpentSchema,
    gifted: z.boolean().default(false),
    expandsBggIds: z.array(bggIdSchema).max(200).default([]),
    expansionBggIds: z.array(bggIdSchema).max(200).default([]),
    hasPlayed: z.boolean().default(false),
  })
  .superRefine(refineGameRanges)
  .transform((game) => ({
    ...game,
    categories: [...new Set(game.categories)],
    expandsBggIds: [...new Set(game.expandsBggIds)],
    expansionBggIds: [...new Set(game.expansionBggIds)],
    mechanics: [...new Set(game.mechanics)],
    families: [...new Set(game.families)],
    favorite: game.location === "collection" ? game.favorite : false,
    gifted: game.location === "collection" ? game.gifted : false,
    hasPlayed: game.location === "collection" ? game.hasPlayed : false,
    moneySpent:
      game.location === "collection" && !game.gifted ? game.moneySpent : 0,
  }));

/** Versioned, canonical representation shared by every export format. */
export const userDataDocumentSchema = z
  .object({
    formatVersion: z.literal(1),
    exportedAt: z.iso.datetime(),
    profile: z.object({
      name: z.string().trim().min(1).max(160),
      email: z.email().max(320),
      currency: z.string().regex(/^[A-Z]{3}$/),
    }),
    items: z.array(portableGameSchema).max(2_000),
  })
  .superRefine((document, context) => {
    const seen = new Set<number>();
    for (const [index, item] of document.items.entries()) {
      if (seen.has(item.bggId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate BoardGameGeek identifier.",
          path: ["items", index, "bggId"],
        });
      }
      seen.add(item.bggId);
    }
  });

/** One portable owned or wished-for board-game record. */
export type PortableGame = z.infer<typeof portableGameSchema>;

/** Versioned, canonical representation shared by every export format. */
export type UserDataDocument = z.infer<typeof userDataDocumentSchema>;

/** Supported portable user-data serialization formats. */
export type UserDataFormat = z.infer<typeof userDataFormatSchema>;
