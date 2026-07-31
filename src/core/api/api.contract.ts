import { z } from "zod";

/** Validates a supported user-data import or export format. */
export const formatSchema = z.enum(["json", "csv", "xlsx", "sql"]);

/** Validates a bounded game-discovery query. */
export const querySchema = z.string().trim().min(3).max(500);

/** Validates a BoardGameGeek object identifier. */
export const bggIdSchema = z.number().int().positive().max(10_000_000);

/** Validates a SHA-256 game-image checksum. */
export const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
