import { z } from "zod";

import { collectionGameSchema } from "@/core/collection/library.contract";
import { databaseUrlSchema } from "@/core/environment/environment.contract";

/** Restricts screenshot seeding to a dedicated local database, never the operator's library. */
export const demoDatabaseUrlSchema = databaseUrlSchema.refine((value) => {
  const url = URL.parse(value);
  return (
    url !== null &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
    url.pathname === "/board_games_tracker_demo"
  );
}, "Use a local PostgreSQL database named board_games_tracker_demo.");

/** Bounds the fictional library shipped in the public demo. */
export const demoLibrarySchema = z.object({
  collection: z.array(collectionGameSchema).max(100),
  wishlist: z.array(collectionGameSchema).max(100),
});

/** Validated fictional library shared by the demo and screenshot account. */
export type DemoLibrary = z.infer<typeof demoLibrarySchema>;

/** Public pages that need no account or server-side mutation. */
export const demoViews = [
  "dashboard",
  "collection",
  "wishlist",
  "play",
  "stats",
] as const;

/** Page names exported by the static showcase. */
export type DemoView = (typeof demoViews)[number];
