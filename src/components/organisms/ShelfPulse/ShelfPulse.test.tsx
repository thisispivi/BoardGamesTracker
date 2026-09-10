import messages from "@messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { ShelfPulse } from "@/components/organisms/ShelfPulse/ShelfPulse";
import type { HomeSummary } from "@/core";
import { createCollectionGame } from "@/test/collectionGame";

const summary: HomeSummary = {
  baseGames: 30,
  expansions: 4,
  favorites: 1,
  heaviestGame: null,
  playedBaseGames: 12,
  recentlyAdded: [],
  showcase: [],
  totalSpent: 412.5,
  unplayed: [],
  wishlist: [],
  wishlistGames: 0,
};

/**
 * Renders the summary in English with a euro currency.
 *
 * @param overrides - Snapshot fields that differ from the sample shelf.
 * @returns The rendering result.
 */
function renderPulse(overrides: Partial<HomeSummary> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ShelfPulse currency="EUR" summary={{ ...summary, ...overrides }} />
    </NextIntlClientProvider>,
  );
}

describe("ShelfPulse", () => {
  it("states played base games against every base game", () => {
    renderPulse();

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("of 30")).toBeInTheDocument();
    expect(screen.getByText("base games played")).toBeInTheDocument();
    expect(screen.getByText("1 favorite")).toBeInTheDocument();
  });

  it("explains the empty tile until a game has a complexity rating", () => {
    renderPulse();

    expect(
      screen.getByText(
        "Complexity ratings show up here once your games have them.",
      ),
    ).toBeInTheDocument();
  });

  it("names the heaviest game with its weight", () => {
    renderPulse({
      heaviestGame: createCollectionGame({
        bggId: 2,
        name: "Brass",
        weight: 3.9,
      }),
    });

    expect(screen.getByText("Brass")).toBeInTheDocument();
    expect(screen.getByText("3.9 / 5")).toBeInTheDocument();
  });
});
