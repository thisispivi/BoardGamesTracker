import type { z } from "zod";

import type { GameDiscoveryResult } from "@/core/discovery/discovery.contract";
import type { selectionSchema } from "@/core/selection/selection.contract";

/** A discovery candidate before artwork and metadata enrichment. */
export type DiscoveredGame = Omit<GameDiscoveryResult, "selectionToken">;

/** Trusted identity decoded from a signed discovery result, without its expiry. */
export type GameSelection = Omit<z.infer<typeof selectionSchema>, "expiresAt">;
