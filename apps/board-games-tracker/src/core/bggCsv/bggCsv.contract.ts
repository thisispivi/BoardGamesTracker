import { z } from "zod";

/** Validates one raw row from an official BoardGameGeek collection export. */
export const importedRowSchema = z.object({
  avgweight: z.string(),
  baverage: z.string(),
  comment: z.string().optional().default(""),
  itemtype: z.string().optional().default("standalone"),
  maxplayers: z.string(),
  maxplaytime: z.string(),
  minplayers: z.string(),
  minplaytime: z.string(),
  numplays: z.string().optional().default("0"),
  objectid: z.string(),
  objectname: z.string(),
  own: z.string(),
  privatecomment: z.string().optional().default(""),
  rating: z.string(),
  yearpublished: z.string(),
});
