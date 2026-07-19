import { z } from "zod";

import { bggImageUrlSchema } from "@/core/shared/shared.contract";

/** Validates the payload authenticated by a game-selection token. */
export const selectionSchema = z.object({
  bggId: z.number().int().positive().max(10_000_000),
  expiresAt: z.number().int().positive(),
  imageUrl: bggImageUrlSchema.nullable(),
  name: z.string().trim().min(1).max(160),
  yearPublished: z.number().int().min(1800).max(2200).nullable(),
});
