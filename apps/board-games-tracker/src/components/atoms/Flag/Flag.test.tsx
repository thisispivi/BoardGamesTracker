import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Flag } from "@/components/atoms/Flag/Flag";

describe("Flag", () => {
  it("draws the flag inline without loading an outside image", () => {
    const { container } = render(<Flag country="it" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("gives every flag its own mask so two flags cannot clip each other", () => {
    const { container } = render(
      <>
        <Flag country="gb" />
        <Flag country="it" />
      </>,
    );

    const ids = [...container.querySelectorAll("mask")].map((mask) => mask.id);
    expect(new Set(ids).size).toBe(2);
  });
});
