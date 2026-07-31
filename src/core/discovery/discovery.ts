/** Board-game result discovered through the configured metasearch service. */
export type GameDiscoveryResult = {
  bggId: number;
  bggUrl: string;
  imageUrl: string | null;
  isExpansion: boolean;
  name: string;
  selectionToken: string;
  yearPublished: number | null;
};

/** Trusted identity decoded from a signed discovery result. */
export type GameSelection = {
  bggId: number;
  imageUrl: string | null;
  isExpansion: boolean;
  name: string;
  yearPublished: number | null;
};
