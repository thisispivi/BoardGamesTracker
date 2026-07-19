import type { z } from "zod";

import type {
  portableGameSchema,
  userDataDocumentSchema,
} from "@/core/contracts/userData";

/** One portable owned or wished-for board-game record. */
export type PortableGame = z.infer<typeof portableGameSchema>;

/** Versioned, canonical representation shared by every export format. */
export type UserDataDocument = z.infer<typeof userDataDocumentSchema>;

/** Supported portable user-data serialization formats. */
export type UserDataFormat = "json" | "csv" | "xlsx" | "sql";
