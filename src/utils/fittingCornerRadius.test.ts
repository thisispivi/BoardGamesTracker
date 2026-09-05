import { describe, expect, it } from "vitest";

import { fittingCornerRadius } from "@/utils/fittingCornerRadius";

/**
 * Angular half-width, in degrees, that a corner of the given radius consumes.
 *
 * Mirrors the tangent-circle angle a rounded sector spends on one corner: below
 * it the sector cannot be rounded at all.
 *
 * @param radius - Radius of the ring edge the corner sits on, in pixels.
 * @param corner - Corner radius seated against that edge, in pixels.
 * @param isInner - Whether the corner sits on the inner edge of the ring.
 * @returns The consumed half-width in degrees.
 */
function cornerAngle(radius: number, corner: number, isInner: boolean): number {
  const centerRadius = isInner ? radius + corner : radius - corner;
  return (Math.asin(corner / centerRadius) * 180) / Math.PI;
}

describe("fittingCornerRadius", () => {
  it("keeps the requested radius when the slice is wide enough", () => {
    expect(
      fittingCornerRadius({
        cornerRadius: 10,
        endAngle: 120,
        innerRadius: 60,
        outerRadius: 95,
        startAngle: 0,
      }),
    ).toBe(10);
  });

  it("shrinks the radius so a sliver still fits both of its corners", () => {
    const innerRadius = 60;
    const outerRadius = 95;
    const sweep = 3;
    const fitted = fittingCornerRadius({
      cornerRadius: 10,
      endAngle: sweep,
      innerRadius,
      outerRadius,
      startAngle: 0,
    });

    expect(fitted).toBeGreaterThan(0);
    expect(fitted).toBeLessThan(10);
    expect(cornerAngle(outerRadius, fitted, false) * 2).toBeLessThan(sweep);
    expect(cornerAngle(innerRadius, fitted, true) * 2).toBeLessThan(sweep);
  });

  it("never exceeds half the ring thickness", () => {
    expect(
      fittingCornerRadius({
        cornerRadius: 40,
        endAngle: 180,
        innerRadius: 60,
        outerRadius: 70,
        startAngle: 0,
      }),
    ).toBe(5);
  });

  it("returns zero for a slice with no angular width", () => {
    expect(
      fittingCornerRadius({
        cornerRadius: 10,
        endAngle: 42,
        innerRadius: 60,
        outerRadius: 95,
        startAngle: 42,
      }),
    ).toBe(0);
  });
});
