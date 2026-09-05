import { type Currency, currencySchema } from "@/core";

/** Currencies exposed by the authoritative account settings contract. */
export const currencies = currencySchema.options;

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
 * Narrows an arbitrary value to a currency the application supports.
 *
 * @param value - A currency code read from a form, cookie, or stored profile.
 * @returns Whether the value is one of the offered ISO 4217 codes.
 */
export function isCurrency(value: unknown): value is Currency {
  return currencies.some((currency) => currency === value);
}

/**
 * Returns the compact symbol shown beside a supported currency code.
 *
 * @param currency - ISO currency code used to format monetary values.
 * @returns The localized symbol, or the currency code when no symbol exists.
 */
export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency];
}
