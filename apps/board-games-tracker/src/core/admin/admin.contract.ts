import { z } from "zod";

import {
  booleanStringSchema,
  gameNameSchema,
  refineGameRanges,
  yearPublishedSchema,
} from "@/core/shared/shared.contract";

/** Validates a bounded account identifier. */
export const userIdSchema = z.string().min(1).max(128);

/** Validates a page number for a paginated administrator list view. */
export const adminPageSchema = z.number().int().positive().max(1_000_000);

/** Validates a bounded search term for a paginated administrator list view. */
export const adminSearchSchema = z.string().trim().max(200).catch("");

/** Validates an application role. */
export const roleSchema = z.enum(["user", "admin"]);

/** Validates the payload authenticated by a password-reset token. */
export const passwordResetTokenSchema = z.object({
  binding: z.string().min(1).max(64),
  expiresAt: z.number().int().positive(),
  userId: z.string().min(1).max(255),
});

/** Validates a replacement password, matching the Better Auth policy. */
export const newPasswordSchema = z.string().min(12).max(128);

/** Validates administrator edits to shared board-game metadata. */
export const gameMetadataSchema = z
  .object({
    bggRating: z.coerce.number().min(0).max(10).nullable(),
    categories: z.string().max(1_000).default(""),
    description: z.string().max(10_000).default(""),
    families: z.string().max(1_000).default(""),
    gameId: z.uuid(),
    isExpansion: booleanStringSchema,
    maxPlayers: z.coerce.number().int().min(1).max(99),
    maxPlaytime: z.coerce.number().int().min(0).max(10_000),
    mechanics: z.string().max(1_000).default(""),
    minPlayers: z.coerce.number().int().min(1).max(99),
    minPlaytime: z.coerce.number().int().min(0).max(10_000),
    name: gameNameSchema,
    weight: z.coerce.number().min(0).max(5).nullable(),
    yearPublished: z.coerce.number().pipe(yearPublishedSchema).nullable(),
  })
  .superRefine(refineGameRanges);

/** Validates where a catalog refresh resumes: the last game processed, or null to start. */
export const catalogRefreshCursorSchema = z.uuid().nullable();
