import { z } from "zod";

import {
  bggIdSchema,
  bggImageUrlSchema,
  gameNameSchema,
  yearPublishedSchema,
} from "@/core/shared/shared.contract";

/** Validates the payload authenticated by a game-selection token. */
export const selectionSchema = z.object({
  bggId: bggIdSchema,
  expiresAt: z.number().int().positive(),
  imageUrl: bggImageUrlSchema.nullable(),
  isExpansion: z.boolean().default(false),
  name: gameNameSchema,
  yearPublished: yearPublishedSchema.nullable(),
});

/** Trusted identity decoded from a signed discovery result, without its expiry. */
export type GameSelection = Omit<z.infer<typeof selectionSchema>, "expiresAt">;
