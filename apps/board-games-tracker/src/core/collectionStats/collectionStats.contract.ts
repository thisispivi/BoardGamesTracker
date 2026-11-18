import { z } from "zod";

/** Validates a spend bracket identifier, ordered from cheapest to dearest. */
const priceBandSchema = z.enum(["upTo25", "upTo50", "upTo100", "over100"]);

/** Spend bracket identifiers, from cheapest to dearest. */
export const priceBands = priceBandSchema.options;

/** One spend bracket a priced game can fall into. */
export type PriceBand = z.infer<typeof priceBandSchema>;

/**
 * Upper bound of each spend bracket in the user's own currency.
 *
 * The brackets are deliberately currency-blind: they describe what the user
 * recorded, whatever that currency is, and the dearest one is open-ended.
 */
export const priceBandBounds: Record<PriceBand, number | null> = {
  upTo25: 25,
  upTo50: 50,
  upTo100: 100,
  over100: null,
};
