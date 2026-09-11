import { z } from "zod";

import { bggMetadataSchema } from "@/core/bgg/bgg.contract";
import { libraryPageSchema } from "@/core/collection/library.contract";
import { gameDiscoveryResultSchema } from "@/core/discovery/discovery.contract";

/** Validates a bounded game-discovery query. */
export const querySchema = z.string().trim().min(3).max(500);

/** Validates a BoardGameGeek object identifier. */
export const bggIdSchema = z.number().int().positive().max(10_000_000);

/** Validates a SHA-256 game-image checksum. */
export const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);

/**
 * Validates the error field of an application route's JSON body.
 *
 * Most routes answer a failure with one translated sentence. The user-data route
 * answers with a stable code instead, which the settings page translates. Either
 * way the browser reads at most a short string and trusts nothing more.
 */
const routeErrorSchema = z.string().max(500).optional();

/** Validates the discovery results served to the add-game dialog. */
export const gameSearchResponseSchema = z.object({
  error: routeErrorSchema,
  results: z.array(gameDiscoveryResultSchema).max(20).default([]),
});

/** Validates the single-game metadata served to the add-game dialog. */
export const gameMetadataResponseSchema = z.object({
  error: routeErrorSchema,
  metadata: bggMetadataSchema.nullable().default(null),
});

/** Validates one library window served to an infinite-scrolling browser. */
export const libraryPageResponseSchema = z.object({
  error: routeErrorSchema,
  page: libraryPageSchema.nullable().default(null),
});

/** Validates the outcome the settings page shows after a data import. */
export const userDataImportResponseSchema = z.object({
  error: routeErrorSchema,
  imported: z.number().int().min(0).max(100_000).default(0),
  success: z.boolean().default(false),
});
