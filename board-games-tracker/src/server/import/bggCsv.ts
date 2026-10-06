import { parse } from "csv-parse/sync";
import { z } from "zod";

import {
  type BggCsvImport,
  earliestPublicationYear,
  type ImportedBggGame,
  importedRowSchema,
  latestPublicationYear,
  maxBggId,
} from "@/core";

const requiredColumns = [
  "objectname",
  "objectid",
  "own",
  "minplayers",
  "maxplayers",
  "minplaytime",
  "maxplaytime",
  "yearpublished",
  "avgweight",
  "baverage",
  "rating",
] as const;

/**
 * Parses a bounded integer field while rejecting malformed values.
 *
 * @param value - A digits-only CSV cell; anything else is treated as absent.
 * @param minimum - Smallest accepted numeric value.
 * @param maximum - Largest accepted numeric value.
 * @returns A bounded integer, or null when the source is absent or invalid.
 */
function integer(
  value: string,
  minimum: number,
  maximum: number,
): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

/**
 * Parses a bounded decimal, treating zero as an unset value when requested.
 *
 * @param value - A numeric CSV cell, which BGG leaves blank or zero when unrated.
 * @param minimum - Smallest accepted numeric value.
 * @param maximum - Largest accepted numeric value.
 * @param zeroIsNull - Whether a zero in the source represents missing data.
 * @returns A bounded decimal, or null when the source is absent or invalid.
 */
function decimal(
  value: string,
  minimum: number,
  maximum: number,
  zeroIsNull = false,
): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || (zeroIsNull && parsed === 0)) {
    return null;
  }
  return parsed >= minimum && parsed <= maximum ? parsed : null;
}

/**
 * Converts one validated CSV object into the local game metadata shape.
 *
 * @param row - Untrusted row read from the uploaded document.
 * @returns A normalized owned-game record, or null for a non-owned row.
 */
function normalizeRow(
  row: z.infer<typeof importedRowSchema>,
): ImportedBggGame | null {
  const bggId = integer(row.objectid, 1, maxBggId);
  const minPlayers = integer(row.minplayers, 1, 99);
  const maxPlayers = integer(row.maxplayers, 1, 99);
  const rawMinPlaytime = integer(row.minplaytime, 0, 10_000);
  const rawMaxPlaytime = integer(row.maxplaytime, 0, 10_000);
  const name = row.objectname.trim();
  if (
    !bggId ||
    !minPlayers ||
    !maxPlayers ||
    rawMinPlaytime === null ||
    rawMaxPlaytime === null ||
    maxPlayers < minPlayers ||
    !name ||
    name.length > 160
  ) {
    return null;
  }

  const maxPlaytime = Math.max(1, rawMaxPlaytime);
  const minPlaytime = Math.min(rawMinPlaytime, maxPlaytime);
  const normalizedYear = row.yearpublished.trim();
  const yearPublished =
    normalizedYear && normalizedYear !== "0"
      ? integer(normalizedYear, earliestPublicationYear, latestPublicationYear)
      : null;
  if (normalizedYear && normalizedYear !== "0" && yearPublished === null) {
    return null;
  }

  const notes = [row.comment, row.privatecomment]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4_000);
  const isExpansion = row.itemtype.trim().toLowerCase() === "expansion";
  const playCount = integer(row.numplays, 0, 1_000_000);
  return {
    bggId,
    bggRating: decimal(row.baverage, 0, 10, true),
    categories: [isExpansion ? "Expansion" : "Board game"],
    hasPlayed: playCount !== null && playCount > 0,
    isExpansion,
    maxPlayers,
    maxPlaytime,
    minPlayers,
    minPlaytime,
    name,
    notes,
    personalRating: decimal(row.rating, 0, 10, true),
    weight: decimal(row.avgweight, 1, 5, true),
    yearPublished,
  };
}

/**
 * Parses an official BGG CSV and returns only explicitly owned games.
 *
 * @param csv - BoardGameGeek CSV text uploaded by the user.
 * @returns The parsed bgg collection csv.
 */
export function parseBggCollectionCsv(csv: string): BggCsvImport {
  const records = z
    .array(z.unknown())
    .min(1)
    .max(2_000)
    .parse(
      parse(csv, {
        bom: true,
        columns: true,
        max_record_size: 20_000,
        relax_column_count: false,
        skip_empty_lines: true,
        trim: true,
      }),
    );

  const first = records[0];
  if (!first || typeof first !== "object") {
    throw new Error("The CSV has no readable header row.");
  }
  const headers = new Set(Object.keys(first));
  if (requiredColumns.some((column) => !headers.has(column))) {
    throw new Error("This is not a supported BoardGameGeek collection export.");
  }

  const games = new Map<number, ImportedBggGame>();
  let invalid = 0;
  let skipped = 0;
  for (const record of records) {
    const parsed = importedRowSchema.safeParse(record);
    if (!parsed.success) {
      invalid += 1;
      continue;
    }
    if (parsed.data.own.trim() !== "1") {
      skipped += 1;
      continue;
    }
    const game = normalizeRow(parsed.data);
    if (!game) {
      invalid += 1;
      continue;
    }
    games.set(game.bggId, game);
  }
  return { games: [...games.values()], invalid, skipped };
}
