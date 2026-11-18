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

/** Supported ISO 4217 code inferred from the account settings contract. */
export type Currency = z.infer<typeof currencySchema>;

/** Validates a supported application UI locale. */
export const localeSchema = z.enum(["en", "it"]);

/** Supported application locale. */
export type AppLocale = z.infer<typeof localeSchema>;

/** Validates library-sharing preferences, keeping prices opt-in. */
export const sharingSchema = z
  .object({
    shareCollection: z.boolean(),
    sharePrices: z.boolean(),
    shareWishlist: z.boolean(),
  })
  .transform((sharing) => ({
    ...sharing,
    sharePrices:
      (sharing.shareCollection || sharing.shareWishlist) && sharing.sharePrices,
  }));

/**
 * Validates the shape of a library share token before it reaches a query.
 *
 * Tokens are 128 random bits as lowercase hexadecimal, and the database
 * enforces the same shape, so anything else is refused without a lookup.
 */
export const shareTokenSchema = z.string().regex(/^[a-f0-9]{32}$/);
