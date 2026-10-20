import { useFormatter } from "next-intl";

/**
 * Formats money in the given currency with the active locale.
 *
 * @param currency - ISO 4217 code the amounts are expressed in.
 * @returns A function turning an amount into a localized string with at most
 * two fraction digits.
 */
export function useCurrencyFormatter(
  currency: string,
): (value: number) => string {
  const format = useFormatter();

  return (value) =>
    format.number(value, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
}
