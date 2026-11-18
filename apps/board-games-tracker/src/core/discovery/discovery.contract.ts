import { z } from "zod";

import {
  bggIdSchema,
  bggImageUrlSchema,
  gameNameSchema,
  yearPublishedSchema,
} from "@/core/shared/shared.contract";

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
  bggId: bggIdSchema,
  bggUrl: z
    .string()
    .regex(
      /^https:\/\/boardgamegeek\.com\/(?:boardgame|boardgameexpansion|boardgameaccessory|boardgameintegration)\/\d{1,8}$/,
    ),
  imageUrl: bggImageUrlSchema.nullable(),
  isExpansion: z.boolean(),
  name: gameNameSchema,
  selectionToken: z.string().min(1).max(4_000),
  yearPublished: yearPublishedSchema.nullable(),
});

/** Board-game result discovered through the configured metasearch service. */
export type GameDiscoveryResult = z.infer<typeof gameDiscoveryResultSchema>;

/** A discovery candidate before its selection token is signed. */
export type DiscoveredGame = Omit<GameDiscoveryResult, "selectionToken">;
