import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { SEARXNG_URL: "http://searxng.test" },
}));

import {
  discoverBoardGameImages,
  searchViaSearxng,
} from "@/server/discovery/searxng";

const searchCases = [
  ["Catan", 13, "Catan"],
  ["Carcassonne", 822, "Carcassonne"],
  ["Wingspan", 266192, "Wingspan"],
  ["Azul", 230802, "Azul"],
  ["Pandemic", 30549, "Pandemic"],
  ["Root", 237182, "Root"],
  ["Codenames", 178900, "Codenames"],
  ["7 Wonders", 68448, "7 Wonders"],
  ["Terraforming Mars", 167791, "Terraforming Mars"],
  ["Spirit Island", 162886, "Spirit Island"],
  ["Ticket to Ride Europe", 14996, "Ticket to Ride: Europe"],
  ["Pandemic Legacy Season 1", 161936, "Pandemic Legacy: Season 1"],
  ["Gloomhaven Jaws of the Lion", 291457, "Gloomhaven: Jaws of the Lion"],
  ["Dune Imperium Uprising", 397598, "Dune: Imperium – Uprising"],
  ["Ark Nova", 342942, "Ark Nova"],
  ["The Crew Mission Deep Sea", 324856, "The Crew: Mission Deep Sea"],
  ["Betrayal at House on the Hill", 10547, "Betrayal at House on the Hill"],
  [
    "Clank! A Deck-Building Adventure",
    201808,
    "Clank!: A Deck-Building Adventure",
  ],
  ["terraforming", 167791, "Terraforming Mars"],
  ["ticket to ride", 9209, "Ticket to Ride"],
  ["pandemic legacy", 161936, "Pandemic Legacy: Season 1"],
  ["gloomhaven", 174430, "Gloomhaven"],
  ["dune imperium", 316554, "Dune: Imperium"],
  ["lord of the rings", 823, "The Lord of the Rings"],
  ["star wars", 187645, "Star Wars: Rebellion"],
  ["pokemon", 1381, "Pokémon Master Trainer"],
  ["7 Wonders Duel", 173346, "7 Wonders Duel"],
  ["Codenames: Duet", 224037, "Codenames: Duet"],
  ["Clank!: Catacombs", 365717, "Clank!: Catacombs"],
  ["Heat: Pedal to the Metal", 366013, "Heat: Pedal to the Metal"],
  ["Dune: Imperium", 316554, "Dune: Imperium"],
  [
    "The Crew: The Quest for Planet Nine",
    284083,
    "The Crew: The Quest for Planet Nine",
  ],
  ["terrafoming mars", 167791, "Terraforming Mars"],
  ["carcassone", 822, "Carcassonne"],
  ["pandmic", 30549, "Pandemic"],
  ["gloomheaven", 174430, "Gloomhaven"],
  ["wingspan boardgame", 266192, "Wingspan"],
  ["ticket ride europe", 14996, "Ticket to Ride: Europe"],
  ["board game about birds wingspan", 266192, "Wingspan"],
  ["dinosaur park board game", 221194, "Dinosaur Island"],
  ["dune deckbuilding board game", 316554, "Dune: Imperium"],
  ["cooperative island spirits game", 162886, "Spirit Island"],
  ["pandemic legacy first season", 161936, "Pandemic Legacy: Season 1"],
  ["train board game europe", 14996, "Ticket to Ride: Europe"],
  ["game where you build a zoo ark", 342942, "Ark Nova"],
  ["two player 7 wonders", 173346, "7 Wonders Duel"],
] as const;

describe("searchViaSearxng", () => {
  it.each(searchCases)(
    "passes user text through and accepts a BGG hit for %s",
    async (query, bggId, name) => {
      let requestedQuery = "";
      const fetchMock = vi.fn(async (input: URL | string) => {
        const endpoint = new URL(String(input));
        requestedQuery = endpoint.searchParams.get("q") ?? "";
        return {
          ok: true,
          status: 200,
          json: async () => ({
            results: [
              {
                img_src: "",
                title: `${name} | Board Game | BoardGameGeek`,
                url: `https://boardgamegeek.com/boardgame/${bggId}/game`,
              },
            ],
          }),
        };
      });
      vi.stubGlobal("fetch", fetchMock);

      const found = await searchViaSearxng(query);

      expect(requestedQuery).toBe(`!pw BoardGameGeek ${query}`);
      expect(found[0]).toMatchObject({ bggId, name });
    },
  );

  it("keeps only the first four ranked BGG links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          results: Array.from({ length: 10 }, (_, index) => ({
            img_src: "",
            title: `Catan Edition ${index} | Board Game | BoardGameGeek`,
            url: `https://boardgamegeek.com/boardgame/${index + 1}/game`,
          })),
        }),
      })),
    );

    await expect(searchViaSearxng("Catan")).resolves.toHaveLength(4);
  });

  it("retries with a quoted title when broad discovery finds no BGG links", async () => {
    const requestedQueries: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) => {
        const query = new URL(String(input)).searchParams.get("q") ?? "";
        requestedQueries.push(query);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            results: query.includes('"Dead Cells"')
              ? [
                  {
                    img_src: "",
                    title:
                      "Dead Cells: The Rogue-Lite Board Game | Board Game |",
                    url: "https://boardgamegeek.com/boardgame/380135/dead-cells-the-rogue-lite-board-game",
                  },
                ]
              : [],
          }),
        };
      }),
    );

    const found = await searchViaSearxng("Dead Cells");

    expect(requestedQueries).toEqual([
      "!pw BoardGameGeek Dead Cells",
      "!mjk BoardGameGeek Dead Cells",
      "!yd BoardGameGeek Dead Cells",
      "!zpm BoardGameGeek Dead Cells",
      '!pw BoardGameGeek "Dead Cells"',
    ]);
    expect(found[0]).toMatchObject({
      bggId: 380_135,
      name: "Dead Cells: The Rogue-Lite Board Game",
    });
  });

  it("maps a matching BGG gallery image to its discovered game", async () => {
    let requestedQuery = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) => {
        requestedQuery = new URL(String(input)).searchParams.get("q") ?? "";
        return {
          ok: true,
          status: 200,
          json: async () => ({
            results: [
              {
                img_src:
                  "https://cf.geekdo-images.com/dead-cells/pic8461280.jpg",
                title: "BoardGameGeek",
                url: "https://boardgamegeek.com/image/8461280/dead-cells-the-rogue-lite-board-game",
              },
            ],
          }),
        };
      }),
    );

    const images = await discoverBoardGameImages([
      {
        bggId: 380_135,
        name: "Dead Cells: The Rogue-Lite Board Game",
      },
    ]);

    expect(requestedQuery).toBe(
      '!bii "Dead Cells: The Rogue-Lite Board Game" BoardGameGeek cover',
    );
    expect(images).toEqual(
      new Map([
        [380_135, "https://cf.geekdo-images.com/dead-cells/pic8461280.jpg"],
      ]),
    );
  });
});
