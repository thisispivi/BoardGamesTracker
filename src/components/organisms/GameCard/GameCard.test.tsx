import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { GameCard } from "@/components/organisms/GameCard/GameCard";
import type { CollectionGame } from "@/core";

vi.mock("@/server/actions/collection", () => ({
  removeGameAction: vi.fn(),
  toggleFavoriteAction: vi.fn(),
  togglePlayedAction: vi.fn(),
  updateCollectionItemAction: vi.fn(),
}));

const base: CollectionGame = {
  bggId: 224_517,
  bggRating: 8.6,
  categories: ["Economic", "Expansion for Base-game"],
  expandsBggIds: [],
  expansionBggIds: [],
  families: [],
  favorite: false,
  gameId: "game-id",
  gifted: false,
  hasPlayed: false,
  id: "item-id",
  imageUrl: null,
  isExpansion: false,
  maxPlayers: 4,
  maxPlaytime: 120,
  mechanics: ["Hand Management"],
  minPlayers: 2,
  minPlaytime: 60,
  moneySpent: 62.5,
  name: "Brass: Birmingham",
  notes: "",
  personalRating: null,
  thumbnailUrl: null,
  weight: 3.86,
  yearPublished: 2018,
};

const expansion: CollectionGame = {
  ...base,
  bggId: 300_000,
  gifted: true,
  id: "expansion-id",
  isExpansion: true,
  moneySpent: 0,
  name: "Brass: Birmingham Promo",
  yearPublished: 2021,
};

/**
 * Renders a card inside the English message provider used by every suite.
 *
 * @param node - Card element under test.
 * @returns Nothing.
 */
function renderCard(node: React.ReactElement): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );
}

describe("GameCard", () => {
  it("shows year, price, taxonomy, and every table fact", () => {
    renderCard(<GameCard currency="EUR" game={base} />);

    expect(screen.getByText("2018")).toBeInTheDocument();
    expect(screen.getByText("€62.50")).toBeInTheDocument();
    expect(screen.getAllByText("Economic").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Expansion for Base-game")).toHaveLength(0);
    expect(
      screen.getByRole("listitem", { name: "Players: 2–4" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Playtime: 2 h" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Complexity: 3.86" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "BGG rating: 8.6" }),
    ).toBeInTheDocument();
  });

  it("offers edit, BoardGameGeek, and removal behind the overflow menu", () => {
    renderCard(<GameCard currency="EUR" game={base} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Brass: Birmingham",
      }),
    );

    expect(
      screen.getByRole("button", { name: "Edit game" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open on BGG" })).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/224517",
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove game" }));
    expect(
      screen.getByRole("alertdialog", { name: "Remove Brass: Birmingham?" }),
    ).toBeInTheDocument();
  });

  it("offers independent favorite and played controls", () => {
    renderCard(<GameCard currency="EUR" game={base} />);

    expect(
      screen.getByRole("button", { name: "Add to favorites" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Mark as played" }),
    ).toHaveAttribute("aria-pressed", "false");

    renderCard(<GameCard currency="EUR" game={{ ...base, hasPlayed: true }} />);
    expect(
      screen.getByRole("button", { name: "Mark as not played" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("lists expansions with their own year, price, and actions", () => {
    renderCard(
      <GameCard currency="EUR" expansions={[expansion]} game={base} />,
    );

    expect(
      screen.getByRole("link", {
        name: "Open Brass: Birmingham Promo on BoardGameGeek",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2021")).toBeInTheDocument();
    expect(screen.getByText("Gifted")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "More actions for Brass: Birmingham Promo",
      }),
    ).toBeInTheDocument();
  });

  it("hides every mutation control for a shared collection", () => {
    renderCard(
      <GameCard currency="EUR" expansions={[expansion]} game={base} readOnly />,
    );

    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /favorites/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /played/ })).toBeNull();
    expect(
      screen.getByRole("link", {
        name: "Open Brass: Birmingham on BoardGameGeek",
      }),
    ).toBeInTheDocument();
  });
});
