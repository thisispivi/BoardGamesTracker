/** Currencies exposed in account settings. */
export const currencies = [
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
] as const;

/** Supported ISO 4217 currency code. */
export type Currency = (typeof currencies)[number];

const currencySymbols: Record<Currency, string> = {
  AUD: "A$",
  CAD: "CA$",
  CHF: "CHF",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  NOK: "kr",
  PLN: "zł",
  SEK: "kr",
  USD: "$",
};

/**
 * Returns the compact symbol shown beside a supported currency code.
 *
 * @param currency - ISO currency code used to format monetary values.
 * @returns The localized symbol, or the currency code when no symbol exists.
 */
export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency];
}
