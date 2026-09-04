import type { GameDiscoveryResult } from "@/core/discovery/discovery.contract";

/** A discovery candidate before artwork and metadata enrichment. */
export type DiscoveredGame = Omit<GameDiscoveryResult, "selectionToken">;

/** Trusted identity decoded from a signed discovery result. */
export type GameSelection = {
  bggId: number;
  imageUrl: string | null;
  isExpansion: boolean;
  name: string;
  yearPublished: number | null;
};
