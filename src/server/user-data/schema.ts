import { z } from "zod";

const labelSchema = z.string().trim().min(1).max(120);
const optionalImageSchema = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "cf.geekdo-images.com";
  })
  .nullable();

/** One portable owned or wished-for board-game record. */
const portableGameSchema = z
  .object({
    location: z.enum(["collection", "wishlist"]),
    bggId: z.number().int().min(1).max(10_000_000),
    name: z.string().trim().min(1).max(160),
    description: z.string().max(20_000),
    imageUrl: optionalImageSchema,
    yearPublished: z.number().int().min(1800).max(2200).nullable(),
    minPlayers: z.number().int().min(1).max(99),
    maxPlayers: z.number().int().min(1).max(99),
    minPlaytime: z.number().int().min(0).max(10_000),
    maxPlaytime: z.number().int().min(1).max(10_000),
    weight: z.number().min(1).max(5).nullable(),
    bggRating: z.number().min(0).max(10).nullable(),
    isExpansion: z.boolean(),
    categories: z.array(labelSchema).max(50),
    mechanics: z.array(labelSchema).max(50),
    families: z.array(labelSchema).max(50),
    favorite: z.boolean(),
    personalRating: z.number().min(0).max(10).nullable(),
    notes: z.string().max(2_000),
    moneySpent: z.number().min(0).max(999_999_999.99),
  })
  .refine((game) => game.maxPlayers >= game.minPlayers)
  .refine((game) => game.maxPlaytime >= game.minPlaytime)
  .transform((game) => ({
    ...game,
    categories: [...new Set(game.categories)],
    mechanics: [...new Set(game.mechanics)],
    families: [...new Set(game.families)],
    favorite: game.location === "collection" ? game.favorite : false,
    moneySpent: game.location === "collection" ? game.moneySpent : 0,
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

export type PortableGame = z.infer<typeof portableGameSchema>;
export type UserDataDocument = z.infer<typeof userDataDocumentSchema>;
export type UserDataFormat = "json" | "csv" | "xlsx" | "sql";
