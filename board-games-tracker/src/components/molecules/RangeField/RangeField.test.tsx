import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { RangeField } from "@/components/molecules/RangeField/RangeField";
import type { NumberRange } from "@/core";

const bounds: NumberRange = { max: 12, min: 1 };

/**
 * Stateful fixture that exercises the controlled range-field contract.
 *
 * @returns A controlled range field for interaction tests.
 */
function RangeFieldFixture() {
  const [value, setValue] = useState<NumberRange>({ max: 6, min: 2 });
  return (
    <RangeField
      bounds={bounds}
      maximumLabel="Maximum players"
      minimumLabel="Minimum players"
      onValueChange={setValue}
      step={1}
      unit="players"
      value={value}
    />
  );
}

describe("RangeField", () => {
  it("exposes both endpoints as separately labelled controls", () => {
    render(<RangeFieldFixture />);

    expect(
      screen.getByRole("slider", { name: "Minimum players" }),
    ).toHaveAttribute("aria-valuenow", "2");
    expect(
      screen.getByRole("slider", { name: "Maximum players" }),
    ).toHaveAttribute("aria-valuenow", "6");
  });

  it("clamps a numeric entry above the offered bounds", async () => {
    const user = userEvent.setup();
    render(<RangeFieldFixture />);

    const maximum = screen.getByRole("textbox", {
      name: "Maximum players",
    });
    await user.type(maximum, "40", {
      initialSelectionEnd: 1,
      initialSelectionStart: 0,
    });

    expect(
      screen.getByRole("textbox", { name: "Maximum players" }),
    ).toHaveValue("12");
  });

  it("reorders the range when the lower entry overtakes the upper one", async () => {
    const user = userEvent.setup();
    render(<RangeFieldFixture />);

    const minimum = screen.getByRole("textbox", {
      name: "Minimum players",
    });
    await user.type(minimum, "9", {
      initialSelectionEnd: 1,
      initialSelectionStart: 0,
    });

    expect(
      screen.getByRole("textbox", { name: "Minimum players" }),
    ).toHaveValue("6");
    expect(
      screen.getByRole("textbox", { name: "Maximum players" }),
    ).toHaveValue("9");
  });
});
