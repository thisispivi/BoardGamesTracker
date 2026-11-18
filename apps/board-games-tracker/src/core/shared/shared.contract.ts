import { z } from "zod";

/**
 * Longest taxonomy label the application stores.
 *
 * Every path that writes a label caps it here so a category typed in the edit
 * form, or scraped from BoardGameGeek, still survives an export and re-import.
 */
export const maxTaxonomyLabelLength = 120;

/** Highest BoardGameGeek object identifier the application accepts. */
export const maxBggId = 10_000_000;

/** Earliest publication year treated as real data rather than a placeholder. */
export const earliestPublicationYear = 1800;

/** Latest publication year accepted, leaving room for announced titles. */
export const latestPublicationYear = 2200;

/** Largest purchase price a collection entry may record. */
export const maxMoneySpent = 999_999_999.99;

/** Validates a BoardGameGeek object identifier. */
export const bggIdSchema = z.number().int().min(1).max(maxBggId);

/** Validates a game title as every catalog source stores it. */
export const gameNameSchema = z.string().trim().min(1).max(160);

/** Validates a publication year inside the range the catalog recognizes. */
export const yearPublishedSchema = z
  .number()
  .int()
  .min(earliestPublicationYear)
  .max(latestPublicationYear);

/** Validates a non-negative purchase price. */
export const moneySpentSchema = z.number().min(0).max(maxMoneySpent);

/**
 * Validates a Boolean serialized as the text `true` or `false`.
 *
 * Form fields, spreadsheet cells, and environment variables all carry Booleans
 * this way, and anything else is rejected rather than read as false.
 */
export const booleanStringSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

/**
 * Validates artwork hosted by BoardGameGeek's secure image CDN.
 *
 * The refinement parses leniently because Zod keeps running checks after the
 * URL format check fails, so throwing there would turn plain text into an
 * exception instead of a rejected value.
 */
export const bggImageUrlSchema = z
  .url()
  .max(2_000)
  .refine((value) => {
    const url = URL.parse(value);
    return (
      url !== null &&
      url.protocol === "https:" &&
      url.hostname === "cf.geekdo-images.com" &&
      !url.port &&
      !url.username &&
      !url.password
    );
  }, "Artwork must use the secure BoardGameGeek image host.");

/** Validates a bounded, non-empty taxonomy label. */
export const labelSchema = z.string().trim().min(1).max(maxTaxonomyLabelLength);

/**
 * Reads a blank or absent form field as null before applying a schema.
 *
 * `FormData.get` answers a missing field with null and an untouched optional
 * input with an empty string; both mean the user left the value out.
 *
 * @param schema - Contract applied when the field carries a value.
 * @returns A schema that yields null for a blank field and the parsed value otherwise.
 */
export function emptyAsNull<TSchema extends z.ZodType>(
  schema: TSchema,
): z.ZodType<z.output<TSchema> | null, unknown> {
  return z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    schema.nullable(),
  );
}

/** Player-count and play-time bounds shared by every game record. */
type GameRanges = {
  maxPlayers: number;
  maxPlaytime: number;
  minPlayers: number;
  minPlaytime: number;
};

/**
 * Rejects a game whose player-count or play-time range is upside down.
 *
 * Applied with `superRefine` by every schema that accepts a complete game, so
 * a form, an import, and an administrator edit agree on what a range is.
 *
 * @param game - Game fields already checked one by one.
 * @param context - Refinement context that collects the issues found.
 * @returns Nothing; issues are reported through the context.
 */
export function refineGameRanges(
  game: GameRanges,
  context: z.RefinementCtx,
): void {
  if (game.maxPlayers < game.minPlayers) {
    context.addIssue({
      code: "custom",
      message: "Maximum players cannot be lower than minimum players.",
      path: ["maxPlayers"],
    });
  }
  if (game.maxPlaytime < game.minPlaytime) {
    context.addIssue({
      code: "custom",
      message: "Maximum duration cannot be lower than minimum duration.",
      path: ["maxPlaytime"],
    });
  }
}
