import { render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";
import { describe, expect, it } from "vitest";

import { StatGrid } from "@/components/molecules/StatGrid/StatGrid";

describe("StatGrid", () => {
  it("pairs every caption with its figure", () => {
    render(
      <StatGrid
        stats={[
          { icon: Heart, label: "Favourites", value: 12 },
          { icon: Heart, label: "Gifts", value: "—" },
        ]}
      />,
    );
    expect(screen.getByText("Favourites")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Gifts")).toBeInTheDocument();
  });

  it("reads a fraction as words instead of a slash", () => {
    render(
      <StatGrid
        stats={[
          {
            icon: Heart,
            label: "Played",
            value: { label: "10 of 20", part: "10", ratio: 0.5, total: "20" },
          },
        ]}
      />,
    );
    expect(screen.getByText("10 of 20")).toBeInTheDocument();
    expect(screen.getByText("Played")).toBeInTheDocument();
  });

  it("renders nothing when there are no figures", () => {
    const { container } = render(<StatGrid stats={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
