import type { z } from "zod";

import type {
  portableGameSchema,
  userDataDocumentSchema,
  userDataFormatSchema,
} from "@/core/userData/userData.contract";

/** One portable owned or wished-for board-game record. */
export type PortableGame = z.infer<typeof portableGameSchema>;

/** Versioned, canonical representation shared by every export format. */
export type UserDataDocument = z.infer<typeof userDataDocumentSchema>;

/** Supported portable user-data serialization formats. */
export type UserDataFormat = z.infer<typeof userDataFormatSchema>;
