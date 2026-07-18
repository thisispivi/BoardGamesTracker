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

/** Returns the compact symbol shown beside a supported currency code. */
export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency];
}
