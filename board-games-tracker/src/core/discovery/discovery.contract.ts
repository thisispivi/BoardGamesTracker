import { z } from "zod";

import { bggImageUrlSchema } from "@/core/shared/shared.contract";

/** Validates the untrusted result payload returned by SearXNG. */
export const searxngResponseSchema = z.object({
  results: z
    .array(
      z.object({
        img_src: z
          .string()
          .max(2_000)
          .nullish()
          .transform((value) => value ?? ""),
        title: z.string().max(500),
        url: z.string().max(2_000),
      }),
    )
    .default([]),
});

/**
 * Validates one signed board-game candidate returned by discovery.
 *
 * The link is checked against the canonical form the server rebuilds from a
 * validated section and identifier, so the browser never renders a href that
 * discovery did not construct itself.
 */
export const gameDiscoveryResultSchema = z.object({
  bggId: z.number().int().min(1).max(10_000_000),
  bggUrl: z
    .string()
    .regex(
      /^https:\/\/boardgamegeek\.com\/(?:boardgame|boardgameexpansion|boardgameaccessory|boardgameintegration)\/\d{1,8}$/,
    ),
  imageUrl: bggImageUrlSchema.nullable(),
  isExpansion: z.boolean(),
  name: z.string().trim().min(1).max(160),
  selectionToken: z.string().min(1).max(4_000),
  yearPublished: z.number().int().min(1800).max(2200).nullable(),
});

/** Board-game result discovered through the configured metasearch service. */
export type GameDiscoveryResult = z.infer<typeof gameDiscoveryResultSchema>;
