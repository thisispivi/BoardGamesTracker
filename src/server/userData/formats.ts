import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { z } from "zod";

import {
  type PortableGame,
  type UserDataDocument,
  userDataDocumentSchema,
  type UserDataFormat,
} from "@/core";
import { validateWorkbookArchive } from "@/server/userData/workbookArchive";

const gameHeaders = [
  "location",
  "bggId",
  "name",
  "description",
  "imageUrl",
  "yearPublished",
  "minPlayers",
  "maxPlayers",
  "minPlaytime",
  "maxPlaytime",
  "weight",
  "bggRating",
  "isExpansion",
  "categories",
  "mechanics",
  "families",
  "favorite",
  "personalRating",
  "notes",
  "moneySpent",
  "gifted",
  "expandsBggIds",
  "expansionBggIds",
] as const;

const legacyGameHeaders = gameHeaders.slice(0, -2);

/**
 * A decoded tabular row keyed by canonical header.
 *
 * Columns are optional because an uploaded document controls its own header
 * row: an export written by an older version legitimately omits the trailing
 * relationship columns, and an arbitrary upload may omit anything at all.
 */
type FlatGame = Partial<Record<(typeof gameHeaders)[number], string>>;

/** Validates that a decoded tabular document is string-valued throughout. */
const tabularRowsSchema = z.array(z.record(z.string(), z.string()));

/** Rejects missing or malformed Boolean cells before document normalization. */
const booleanCellSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

/**
 * A decoded tabular row before `userDataDocumentSchema` validates it.
 *
 * A spreadsheet cell carries no type, so the library section and the taxonomy
 * entries are still arbitrary values here; only the document schema narrows
 * them to the portable shape.
 */
type DecodedGame = Omit<
  PortableGame,
  "categories" | "families" | "location" | "mechanics"
> & {
  categories: unknown[];
  families: unknown[];
  location: string;
  mechanics: unknown[];
};

/**
 * Serializes canonical data into the user-selected portable format.
 *
 * @param document - The portable user-data document.
 * @param format - The requested data format.
 * @returns The serialized user data.
 */
export async function serializeUserData(
  document: UserDataDocument,
  format: UserDataFormat,
): Promise<Uint8Array> {
  if (format === "xlsx") return serializeXlsx(document);
  const text =
    format === "json"
      ? JSON.stringify(document, null, 2)
      : format === "csv"
        ? serializeCsv(document)
        : serializeSql(document);
  return new TextEncoder().encode(text);
}

/**
 * Parses one supported export without evaluating uploaded code or SQL.
 *
 * @param bytes - The serialized input bytes.
 * @param format - The requested data format.
 * @returns The parsed user data.
 */
export async function parseUserData(
  bytes: Uint8Array,
  format: UserDataFormat,
): Promise<UserDataDocument> {
  if (format === "xlsx") return parseXlsx(bytes);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const raw =
    format === "json"
      ? JSON.parse(text)
      : format === "csv"
        ? parseCsv(text)
        : parseSql(text);
  return userDataDocumentSchema.parse(raw);
}

/** Download content type served for each supported export format. */
const exportContentTypes: Record<UserDataFormat, string> = {
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  sql: "application/sql; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Returns the filename extension and content type for one export format.
 *
 * @param format - The requested data format.
 * @returns The download extension and content type for that format.
 */
export function getExportMetadata(format: UserDataFormat): {
  contentType: string;
  extension: UserDataFormat;
} {
  return { extension: format, contentType: exportContentTypes[format] };
}

/**
 * Converts canonical data into a readable two-record-type CSV document.
 *
 * @param document - The portable user-data document.
 * @returns A spreadsheet-safe CSV representation of the portable document.
 */
function serializeCsv(document: UserDataDocument): string {
  const headers = [
    "recordType",
    "formatVersion",
    "exportedAt",
    "profileName",
    "profileEmail",
    "profileCurrency",
    ...gameHeaders,
  ];
  const rows: string[][] = [
    headers,
    [
      "profile",
      String(document.formatVersion),
      document.exportedAt,
      document.profile.name,
      document.profile.email,
      document.profile.currency,
      ...gameHeaders.map(() => ""),
    ],
    ...document.items.map((item) => [
      "game",
      String(document.formatVersion),
      document.exportedAt,
      "",
      "",
      "",
      ...gameToFlatValues(item),
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/**
 * Parses the application's flat CSV representation.
 *
 * @param text - Serialized user-data text to parse.
 * @returns An untrusted portable-document candidate decoded from CSV.
 */
function parseCsv(text: string): unknown {
  const rows = tabularRowsSchema.parse(
    parse(text, {
      bom: true,
      columns: true,
      max_record_size: 100_000,
      relax_column_count: false,
      skip_empty_lines: true,
    }),
  );
  const profiles = rows.filter((row) => row.recordType === "profile");
  const [profile] = profiles;
  if (
    !profile ||
    profiles.length !== 1 ||
    rows.length > 2_001 ||
    rows.some(
      (row) => row.recordType !== "profile" && row.recordType !== "game",
    )
  ) {
    throw new Error("Invalid CSV export.");
  }
  return buildDocument(
    profile.formatVersion ?? "",
    profile.exportedAt ?? "",
    {
      name: unprotectCell(profile.profileName ?? ""),
      email: unprotectCell(profile.profileEmail ?? ""),
      currency: profile.profileCurrency ?? "",
    },
    rows.filter((row) => row.recordType === "game").map(flatToGame),
  );
}

/**
 * Writes a styled, editable workbook with separate profile and game sheets.
 *
 * @param document - The portable user-data document.
 * @returns The XLSX workbook serialized as bytes.
 */
async function serializeXlsx(document: UserDataDocument): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Board Games Tracker";
  workbook.created = new Date(document.exportedAt);
  const profile = workbook.addWorksheet("Profile", {
    views: [{ showGridLines: false }],
  });
  profile.addRows([
    ["Board Games Tracker user data export", ""],
    ["Format version", document.formatVersion],
    ["Exported at", document.exportedAt],
    ["Name", safeSpreadsheetText(document.profile.name)],
    ["Email", safeSpreadsheetText(document.profile.email)],
    ["Currency", document.profile.currency],
  ]);
  profile.mergeCells("A1:B1");
  profile.columns = [{ width: 24 }, { width: 48 }];
  profile.getRow(1).height = 30;
  profile.getRow(1).font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 16,
  };
  profile.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF5B4BDB" },
  };
  for (let row = 2; row <= 6; row += 1) {
    profile.getCell(row, 1).font = { bold: true };
  }

  const gamesSheet = workbook.addWorksheet("Games", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  gamesSheet.addRow([...gameHeaders]);
  for (const item of document.items) {
    const row = gamesSheet.addRow(gameToWorksheetValues(item));
    row.getCell(1).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"collection,wishlist"'],
    };
  }
  gamesSheet.autoFilter = `A1:W${Math.max(1, document.items.length + 1)}`;
  gamesSheet.getRow(1).height = 28;
  gamesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  gamesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF5B4BDB" },
  };
  const widths = [
    14, 10, 30, 44, 42, 14, 11, 11, 13, 13, 10, 11, 12, 34, 34, 34, 10, 14, 38,
    14, 12, 34, 34,
  ];
  widths.forEach((width, index) => {
    gamesSheet.getColumn(index + 1).width = width;
  });
  gamesSheet.getColumn(20).numFmt = "0.00";
  gamesSheet.getColumn(18).numFmt = "0.0";
  gamesSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: false };
  });
  const output = await workbook.xlsx.writeBuffer();
  return new Uint8Array(output);
}

/**
 * Hands uploaded bytes to ExcelJS in the buffer shape it actually reads.
 *
 * ExcelJS types `load` against the DOM `Buffer`, which no Node value satisfies,
 * while a Node buffer is its documented and only supported input. The assertion
 * corrects the declaration, not the value. Drop it once ExcelJS types Node.
 *
 * @param bytes - The uploaded workbook bytes.
 * @returns The same bytes typed as the workbook loader's parameter.
 */
function toWorkbookInput(
  bytes: Uint8Array,
): Parameters<ExcelJS.Xlsx["load"]>[0] {
  return Buffer.from(bytes) as unknown as Parameters<ExcelJS.Xlsx["load"]>[0];
}

/**
 * Reads the two-sheet Board Games Tracker workbook representation.
 *
 * @param bytes - The serialized input bytes.
 * @returns A validated portable document decoded from an XLSX workbook.
 */
async function parseXlsx(bytes: Uint8Array): Promise<UserDataDocument> {
  await validateWorkbookArchive(bytes);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toWorkbookInput(bytes));
  const profile = workbook.getWorksheet("Profile");
  const gamesSheet = workbook.getWorksheet("Games");
  if (!profile || !gamesSheet)
    throw new Error("Required worksheets are missing.");
  const headers = gamesSheet.getRow(1).values;
  if (!Array.isArray(headers)) {
    throw new Error("Invalid Games worksheet.");
  }
  const activeHeaders = matchesWorksheetHeaders(headers, gameHeaders)
    ? gameHeaders
    : matchesWorksheetHeaders(headers, legacyGameHeaders)
      ? legacyGameHeaders
      : null;
  if (!activeHeaders) throw new Error("Invalid Games worksheet.");
  const items: DecodedGame[] = [];
  gamesSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const flat: FlatGame = Object.fromEntries(
      activeHeaders.map((header, index) => [
        header,
        row.getCell(index + 1).text,
      ]),
    );
    if (flat.bggId) items.push(flatToGame(flat));
  });
  return userDataDocumentSchema.parse(
    buildDocument(
      profile.getCell("B2").text,
      profile.getCell("B3").text,
      {
        name: unprotectCell(profile.getCell("B4").text),
        email: unprotectCell(profile.getCell("B5").text),
        currency: profile.getCell("B6").text,
      },
      items,
    ),
  );
}

/**
 * Produces SQL-shaped text while retaining a strict, non-executable import path.
 *
 * @param document - The portable user-data document.
 * @returns A non-executable SQL-style representation of the portable document.
 */
function serializeSql(document: UserDataDocument): string {
  const json = JSON.stringify(document).replaceAll("'", "''");
  return [
    "-- Board Games Tracker user data export. Import this through app settings; do not execute it directly.",
    "CREATE TABLE IF NOT EXISTS board_games_tracker_user_export (payload_json text NOT NULL);",
    `INSERT INTO board_games_tracker_user_export (payload_json) VALUES ('${json}');`,
    "",
  ].join("\n");
}

/**
 * Extracts the app's single escaped JSON literal and never executes SQL.
 *
 * @param text - Serialized user-data text to parse.
 * @returns An untrusted portable-document candidate decoded from the SQL-style export.
 */
function parseSql(text: string): unknown {
  const match =
    /INSERT\s+INTO\s+board_games_tracker_user_export\s*\(\s*payload_json\s*\)\s*VALUES\s*\(\s*'((?:''|[^'])*)'\s*\)\s*;/is.exec(
      text,
    );
  if (!match?.[1]) throw new Error("Invalid Board Games Tracker SQL export.");
  return JSON.parse(match[1].replaceAll("''", "'"));
}

/**
 * Flattens arrays and nullable values for CSV and worksheet cells.
 *
 * @param game - Portable game record being serialized or parsed.
 * @returns String values aligned with the canonical tabular headers.
 */
function gameToFlatValues(game: PortableGame): string[] {
  return [
    game.location,
    String(game.bggId),
    game.name,
    game.description,
    game.imageUrl ?? "",
    game.yearPublished === null ? "" : String(game.yearPublished),
    String(game.minPlayers),
    String(game.maxPlayers),
    String(game.minPlaytime),
    String(game.maxPlaytime),
    game.weight === null ? "" : String(game.weight),
    game.bggRating === null ? "" : String(game.bggRating),
    String(game.isExpansion),
    JSON.stringify(game.categories),
    JSON.stringify(game.mechanics),
    JSON.stringify(game.families),
    String(game.favorite),
    game.personalRating === null ? "" : String(game.personalRating),
    game.notes,
    String(game.moneySpent),
    String(game.gifted),
    JSON.stringify(game.expandsBggIds),
    JSON.stringify(game.expansionBggIds),
  ];
}

/**
 * Preserves numeric and Boolean cell types in editable XLSX exports.
 *
 * @param game - Portable game record being serialized or parsed.
 * @returns Worksheet cell values aligned with the canonical tabular headers.
 */
function gameToWorksheetValues(game: PortableGame): unknown[] {
  return [
    game.location,
    game.bggId,
    safeSpreadsheetText(game.name),
    safeSpreadsheetText(game.description),
    game.imageUrl ?? "",
    game.yearPublished,
    game.minPlayers,
    game.maxPlayers,
    game.minPlaytime,
    game.maxPlaytime,
    game.weight,
    game.bggRating,
    game.isExpansion,
    safeSpreadsheetText(JSON.stringify(game.categories)),
    safeSpreadsheetText(JSON.stringify(game.mechanics)),
    safeSpreadsheetText(JSON.stringify(game.families)),
    game.favorite,
    game.personalRating,
    safeSpreadsheetText(game.notes),
    game.moneySpent,
    game.gifted,
    safeSpreadsheetText(JSON.stringify(game.expandsBggIds)),
    safeSpreadsheetText(JSON.stringify(game.expansionBggIds)),
  ];
}

/**
 * Restores one flat game row into strongly typed primitive values.
 *
 * @param row - Untrusted row read from the uploaded document.
 * @returns A decoded row awaiting document-schema validation.
 */
function flatToGame(row: FlatGame): DecodedGame {
  const imageUrl = requiredCell(row.imageUrl);
  return {
    location: requiredCell(row.location),
    bggId: requiredNumber(row.bggId),
    name: unprotectCell(requiredCell(row.name)),
    description: unprotectCell(requiredCell(row.description)),
    imageUrl: imageUrl === "" ? null : imageUrl,
    yearPublished: optionalNumber(row.yearPublished),
    minPlayers: requiredNumber(row.minPlayers),
    maxPlayers: requiredNumber(row.maxPlayers),
    minPlaytime: requiredNumber(row.minPlaytime),
    maxPlaytime: requiredNumber(row.maxPlaytime),
    weight: optionalNumber(row.weight),
    bggRating: optionalNumber(row.bggRating),
    isExpansion: booleanCellSchema.parse(row.isExpansion),
    categories: parseLabels(requiredCell(row.categories)),
    mechanics: parseLabels(requiredCell(row.mechanics)),
    families: parseLabels(requiredCell(row.families)),
    favorite: booleanCellSchema.parse(row.favorite),
    personalRating: optionalNumber(row.personalRating),
    notes: unprotectCell(requiredCell(row.notes)),
    moneySpent: requiredNumber(row.moneySpent),
    gifted: booleanCellSchema.parse(row.gifted),
    expandsBggIds: parseBggIds(row.expandsBggIds),
    expansionBggIds: parseBggIds(row.expansionBggIds),
  };
}

/**
 * Creates the shared raw document shape before final Zod validation.
 *
 * @param formatVersion - Portable document version declared by the import.
 * @param exportedAt - ISO timestamp recorded in the imported document.
 * @param profile - Portable user preferences included in the import.
 * @param items - Decoded game rows included in the import.
 * @returns An untrusted document candidate for schema validation.
 */
function buildDocument(
  formatVersion: string,
  exportedAt: string,
  profile: UserDataDocument["profile"],
  items: DecodedGame[],
): unknown {
  return {
    formatVersion: requiredNumber(formatVersion),
    exportedAt,
    profile,
    items,
  };
}

/**
 * Reads a column that every supported export is required to carry.
 *
 * @param value - The cell text, or undefined when the document omits the column.
 * @returns The cell text.
 */
function requiredCell(value: string | undefined): string {
  if (value === undefined) {
    throw new Error("The document is missing a required column.");
  }
  return value;
}

/**
 * Quotes a CSV cell and protects spreadsheet viewers from formula injection.
 *
 * @param value - The field text going into one CSV cell.
 * @returns A quoted CSV cell safe from spreadsheet formula execution.
 */
function csvCell(value: string): string {
  const safe = safeSpreadsheetText(value);
  return `"${safe.replaceAll('"', '""')}"`;
}

/**
 * Prefixes text that spreadsheet programs could otherwise treat as a formula.
 *
 * @param value - Exported text that a user could have started with `=`, `+`, `-`, or `@`.
 * @returns Text prefixed when necessary to prevent spreadsheet formula execution.
 */
function safeSpreadsheetText(value: string): string {
  return /^['=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
}

/**
 * Reverses the explicit formula-injection protection on trusted export fields.
 *
 * @param value - A cell that may still carry the leading quote this app added.
 * @returns Original text recovered from a formula-protected spreadsheet cell.
 */
function unprotectCell(value: string): string {
  return /^'['=+\-@\t\r\n]/.test(value) ? value.slice(1) : value;
}

/**
 * Parses a finite required number before bounded schema validation.
 *
 * @param value - A numeric cell the format requires, or undefined when absent.
 * @returns A finite required number decoded from the imported value.
 */
function requiredNumber(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    throw new Error("A required numeric value is missing.");
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Invalid numeric value.");
  return parsed;
}

/**
 * Parses an empty nullable number or delegates to the finite parser.
 *
 * @param value - A numeric cell the format allows to be blank or absent.
 * @returns A finite number, or null when the imported value is absent.
 */
function optionalNumber(value: string | undefined): number | null {
  return value === "" ? null : requiredNumber(value);
}

/**
 * Decodes a JSON taxonomy array from one cell.
 *
 * Entries stay unknown here: the document schema is what rejects a label that
 * is not bounded text.
 *
 * @param value - The JSON array text stored in a taxonomy column.
 * @returns The decoded entries, before label validation.
 */
function parseLabels(value: string): unknown[] {
  const parsed: unknown = JSON.parse(unprotectCell(value));
  if (!Array.isArray(parsed)) throw new Error("Invalid taxonomy list.");
  return parsed;
}

/**
 * Parses optional BGG relationship identifiers from new portable exports.
 *
 * @param value - JSON array text, or an absent value from a legacy export.
 * @returns Relationship identifiers for final bounded schema validation.
 */
function parseBggIds(value: string | undefined): number[] {
  if (value === undefined || value === "") return [];
  const parsed: unknown = JSON.parse(unprotectCell(value));
  if (!Array.isArray(parsed)) throw new Error("Invalid BGG relationship list.");
  return parsed.map((entry) => {
    if (typeof entry !== "number") {
      throw new Error("Invalid BGG relationship identifier.");
    }
    return entry;
  });
}

/**
 * Checks an XLSX header row against one supported portable schema.
 *
 * @param headers - Worksheet cell values including ExcelJS's empty zero index.
 * @param expected - Ordered field names accepted for the Games worksheet.
 * @returns Whether every expected column is present in the declared position.
 */
function matchesWorksheetHeaders(
  headers: readonly unknown[],
  expected: readonly string[],
): boolean {
  return expected.every(
    (header, index) => String(headers[index + 1]) === header,
  );
}
