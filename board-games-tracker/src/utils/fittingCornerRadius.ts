/**
 * Safety margin applied to a fitted corner radius.
 *
 * Recharts falls back to a square-cornered sector the moment the requested
 * rounding needs more arc than the slice owns, so the fitted value stays
 * strictly below that threshold instead of landing exactly on it.
 */
const cornerFitMargin = 0.92;

/** Degrees per radian, used to convert a sector sweep for `Math.sin`. */
const degreesPerRadian = 180 / Math.PI;

/** Geometry of one annular sector, in pixels and degrees. */
type SliceGeometry = {
  cornerRadius: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
};

/**
 * Largest corner radius a ring slice can round by without losing its corners.
 *
 * A sector is rounded by inscribing a circle of the requested radius in each
 * corner. When a slice is too narrow to seat those circles, Recharts silently
 * drops back to sharp corners, which is why a complexity band holding a couple
 * of games renders as a bare sliver. Shrinking the radius to what the slice can
 * actually seat keeps every band rounded, however thin. The result is clamped
 * to half the ring thickness and is never larger than the requested radius.
 *
 * @param root0 - Geometry of the slice being drawn.
 * @param root0.cornerRadius - Rounding requested by the chart, in pixels.
 * @param root0.endAngle - Trailing edge of the slice, in degrees.
 * @param root0.innerRadius - Inner edge of the ring, in pixels.
 * @param root0.outerRadius - Outer edge of the ring, in pixels.
 * @param root0.startAngle - Leading edge of the slice, in degrees.
 * @returns A corner radius in pixels, zero for a slice of no width.
 */
export function fittingCornerRadius({
  cornerRadius,
  endAngle,
  innerRadius,
  outerRadius,
  startAngle,
}: SliceGeometry): number {
  const halfSweepSine = Math.sin(
    Math.abs(endAngle - startAngle) / 2 / degreesPerRadian,
  );
  if (halfSweepSine <= 0) {
    return 0;
  }

  const outerFit = (outerRadius * halfSweepSine) / (1 + halfSweepSine);
  const innerFit =
    halfSweepSine >= 1
      ? Number.POSITIVE_INFINITY
      : (innerRadius * halfSweepSine) / (1 - halfSweepSine);

  return Math.max(
    0,
    Math.min(
      cornerRadius,
      (outerRadius - innerRadius) / 2,
      outerFit * cornerFitMargin,
      innerFit * cornerFitMargin,
    ),
  );
}
