import { z } from "zod";

/** Validates a bounded account identifier. */
export const userIdSchema = z.string().min(1).max(128);

/** Validates a page number for a paginated administrator list view. */
export const adminPageSchema = z.number().int().positive().max(1_000_000);

/** Validates a bounded search term for a paginated administrator list view. */
export const adminSearchSchema = z.string().trim().max(200).catch("");

/** Validates an application role. */
export const roleSchema = z.enum(["user", "admin"]);

/** Validates serialized ban-state form values. */
export const bannedSchema = z.enum(["true", "false"]);

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
    isExpansion: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
    maxPlayers: z.coerce.number().int().min(1).max(99),
    maxPlaytime: z.coerce.number().int().min(0).max(10_000),
    mechanics: z.string().max(1_000).default(""),
    minPlayers: z.coerce.number().int().min(1).max(99),
    minPlaytime: z.coerce.number().int().min(0).max(10_000),
    name: z.string().trim().min(1).max(160),
    weight: z.coerce.number().min(0).max(5).nullable(),
    yearPublished: z.coerce.number().int().min(1800).max(2200).nullable(),
  })
  .refine((game) => game.maxPlayers >= game.minPlayers, {
    message: "Maximum players cannot be lower than minimum players.",
    path: ["maxPlayers"],
  })
  .refine((game) => game.maxPlaytime >= game.minPlaytime, {
    message: "Maximum duration cannot be lower than minimum duration.",
    path: ["maxPlaytime"],
  });

/** Serialized shared game row rendered by the administrator console. */
export type AdminGame = {
  bggId: number;
  bggRating: number | null;
  categories: string[];
  description: string;
  families: string[];
  id: string;
  imageUrl: string | null;
  isExpansion: boolean;
  maxPlayers: number;
  maxPlaytime: number;
  mechanics: string[];
  minPlayers: number;
  minPlaytime: number;
  name: string;
  owners: number;
  yearPublished: number | null;
  weight: number | null;
};

/** One bounded page of shared game records rendered by the administrator console. */
export type AdminGamesPage = {
  games: AdminGame[];
  page: number;
  pages: number;
};
