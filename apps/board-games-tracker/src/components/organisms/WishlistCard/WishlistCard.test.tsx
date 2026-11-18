import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { WishlistCard } from "@/components/organisms/WishlistCard/WishlistCard";
import type { CollectionGame } from "@/core";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/server/actions/collection", () => ({
  moveWishlistToCollectionAction: vi.fn(),
  removeGameAction: vi.fn(),
}));

const game: CollectionGame = {
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
  moneySpent: 0,
  name: "Brass: Birmingham",
  notes: "",
  personalRating: null,
  thumbnailUrl: null,
  weight: 3.86,
  yearPublished: 2018,
};

/**
 * Renders the wishlist card inside the English message provider.
 *
 * @returns Nothing.
 */
function renderCard(): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WishlistCard currency="EUR" game={game} />
    </NextIntlClientProvider>,
  );
}

describe("WishlistCard", () => {
  it("shows the same year, taxonomy, and facts as a collection card", () => {
    renderCard();

    expect(screen.getByText("2018")).toBeInTheDocument();
    expect(screen.getAllByText("Economic").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Expansion for Base-game")).toHaveLength(0);
    expect(
      screen.getByRole("listitem", { name: "Players: 2–4" }),
    ).toBeInTheDocument();
    const artworkLink = screen.getByRole("link", {
      name: "Open Brass: Birmingham on BoardGameGeek",
    });
    expect(artworkLink).toHaveAttribute(
      "href",
      "https://boardgamegeek.com/boardgame/224517",
    );
    expect(artworkLink.getAttribute("class")).toContain("aspect-square");
  });

  it("never shows a price for a game that is not owned yet", () => {
    renderCard();

    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryByText("Gifted")).toBeNull();
  });

  it("opens the purchase and removal dialogs from the card actions", () => {
    renderCard();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add Brass: Birmingham to your collection",
      }),
    );
    expect(
      screen.getByRole("dialog", {
        name: "Add Brass: Birmingham to your collection",
      }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove Brass: Birmingham from the wishlist?",
      }),
    );
    expect(
      screen.getByRole("alertdialog", {
        name: "Remove Brass: Birmingham from the wishlist?",
      }),
    ).toBeInTheDocument();
  });
});
