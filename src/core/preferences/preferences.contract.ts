import { z } from "zod";

/** Validates a supported ISO 4217 display currency. */
export const currencySchema = z.enum([
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "EUR",
  "GBP",
  "JPY",
  "NOK",
  "PLN",
  "SEK",
  "USD",
]);

/** Validates collection-sharing preferences, keeping prices opt-in. */
export const sharingSchema = z
  .object({
    shareCollection: z.boolean(),
    sharePrices: z.boolean(),
  })
  .transform((sharing) => ({
    shareCollection: sharing.shareCollection,
    sharePrices: sharing.shareCollection && sharing.sharePrices,
  }));
