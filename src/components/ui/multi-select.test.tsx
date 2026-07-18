import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { MultiSelect } from "@/components/ui/multi-select";

const options = [
  { count: 12, label: "Cooperative Game", value: "cooperative" },
  { count: 34, label: "Dice Rolling", value: "dice" },
  { count: 9, label: "Worker Placement", value: "workers" },
];

/** Stateful fixture that exercises the controlled multi-select contract. */
function MultiSelectFixture() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <MultiSelect
      ariaLabel="Filter by mechanic"
      clearLabel="Clear selection"
      emptyLabel="No matching options."
      onValueChange={setValues}
      options={options}
      placeholder="All mechanics"
      searchPlaceholder="Search mechanics…"
      selectedSummary="Selected"
      values={values}
    />
  );
}

describe("MultiSelect", () => {
  /** Filters a long option list and retains multiple checked values. */
  it("searches and selects more than one option", async () => {
    const user = userEvent.setup();
    render(<MultiSelectFixture />);

    await user.click(
      screen.getByRole("button", { name: "Filter by mechanic" }),
    );
    const listbox = screen.getByRole("listbox", {
      name: "Filter by mechanic",
    });
    expect(listbox).toHaveClass("max-h-72", "overflow-y-auto");

    await user.type(screen.getByPlaceholderText("Search mechanics…"), "coop");
    expect(within(listbox).getAllByRole("option")).toHaveLength(1);
    await user.click(
      within(listbox).getByRole("option", { name: /Cooperative Game/ }),
    );

    await user.clear(screen.getByPlaceholderText("Search mechanics…"));
    await user.click(
      within(listbox).getByRole("option", { name: /Dice Rolling/ }),
    );
    const trigger = screen.getByRole("button", {
      name: "Filter by mechanic",
    });
    expect(trigger).toHaveTextContent("Selected");
    expect(within(trigger).getByText("2")).toBeVisible();
  });
});
