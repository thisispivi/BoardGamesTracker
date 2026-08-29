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

  it("renders nothing when there are no figures", () => {
    const { container } = render(<StatGrid stats={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
