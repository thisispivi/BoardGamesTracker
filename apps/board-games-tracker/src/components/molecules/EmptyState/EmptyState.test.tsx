import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";

describe("EmptyState", () => {
  it("exposes the title as a heading when one is given", () => {
    render(
      <EmptyState description="Add one." icon={Search} title="No games" />,
    );
    expect(
      screen.getByRole("heading", { name: "No games" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Add one.")).toBeInTheDocument();
  });

  it("omits the heading for a transient no-results state", () => {
    render(<EmptyState description="Nothing matched." icon={Search} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
