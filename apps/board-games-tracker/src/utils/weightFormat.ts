/**
 * Fraction digits that render a BoardGameGeek weight on its one-to-five scale.
 *
 * The scale is meaningful to two decimals, and a fixed pair of them keeps a
 * column of weights aligned instead of ragged between values such as 3.4 and
 * 3.45.
 */
export const weightNumberFormat = {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
};
