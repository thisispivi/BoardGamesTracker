import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { GameFacts } from "@/components/molecules/GameFacts/GameFacts";
import type { CollectionGame } from "@/core";

import messages from "../../../../messages/en.json";

const game: CollectionGame = {
  bggId: 1,
  bggRating: 7.5,
  categories: [],
  expansionBggIds: [],
  expandsBggIds: [],
  families: [],
  favorite: false,
  gameId: "game-id",
  gifted: false,
  id: "item-id",
  imageUrl: null,
  isExpansion: false,
  maxPlayers: 4,
  maxPlaytime: 90,
  mechanics: [],
  minPlayers: 2,
  minPlaytime: 45,
  moneySpent: 0,
  name: "Brass",
  notes: "",
  personalRating: null,
  thumbnailUrl: null,
  weight: 3.286,
  yearPublished: 2018,
};

describe("GameFacts", () => {
  it("shows complexity with every meaningful decimal digit", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GameFacts game={game} />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("listitem", { name: "Complexity: 3.286" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Playtime: 1 h 30 min" }),
    ).toBeInTheDocument();
  });
});
