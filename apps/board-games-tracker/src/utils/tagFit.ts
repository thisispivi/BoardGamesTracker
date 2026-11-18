/**
 * Counts how many leading pills fit on one line beside an overflow chip.
 *
 * Widths are measured in pixels from a row rendered at its natural size, so the
 * answer never depends on what is currently visible and cannot oscillate
 * between two counts. When any pill is dropped the overflow chip has to fit as
 * well, which can force one more pill out than raw width alone would suggest.
 *
 * @param widths - Natural pixel width of every pill, in display order.
 * @param gap - Pixel gap rendered between two adjacent pills.
 * @param available - Pixel width the row may occupy.
 * @param overflowWidth - Pixel width of the chip that summarizes hidden pills.
 * @returns The number of leading pills to render, between zero and every pill.
 */
export function countFittingTags(
  widths: readonly number[],
  gap: number,
  available: number,
  overflowWidth: number,
): number {
  let used = 0;
  let count = 0;

  for (const width of widths) {
    const next = count === 0 ? width : used + gap + width;
    if (next > available) break;
    used = next;
    count += 1;
  }

  while (
    count > 0 &&
    count < widths.length &&
    used + gap + overflowWidth > available
  ) {
    count -= 1;
    used -= (widths[count] ?? 0) + (count === 0 ? 0 : gap);
  }

  return count;
}
