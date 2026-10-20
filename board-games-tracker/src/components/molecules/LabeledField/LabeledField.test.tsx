import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LabeledField } from "@/components/molecules/LabeledField/LabeledField";

describe("LabeledField", () => {
  it("names the wrapped control with its label", () => {
    render(
      <LabeledField label="Year published">
        <input type="number" />
      </LabeledField>,
    );

    expect(
      screen.getByRole("spinbutton", { name: "Year published" }),
    ).toBeInTheDocument();
  });
});
