import messages from "@messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { StatsCharts } from "@/components/organisms/StatsCharts/StatsCharts";

/**
 * Renders the chart dashboard with rated games and no other collection data.
 *
 * @returns Nothing.
 */
function renderCharts(): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StatsCharts
        categories={[]}
        complexity={[]}
        currency="EUR"
        decades={[]}
        easiestGames={[{ name: "Love Letter", value: 1.2 }]}
        hardestGames={[{ name: "Mage Knight", value: 4.3 }]}
        mechanics={[]}
        mostExpensive={[]}
        playerCounts={[]}
        playtime={[]}
      />
    </NextIntlClientProvider>,
  );
}

describe("StatsCharts", () => {
  it("shows the easiest and the hardest games as two separate charts", () => {
    renderCharts();

    expect(
      screen.getByRole("heading", { name: "Easiest games" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hardest games" }),
    ).toBeInTheDocument();
  });
});
