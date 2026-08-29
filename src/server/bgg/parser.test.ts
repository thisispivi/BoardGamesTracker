import { describe, expect, it } from "vitest";

import { parseBggHtmlPage, parseBggJsonResponses } from "@/server/bgg/parser";

const ticketToRideHtml = `
  <html>
    <head>
      <meta property="og:url" content="https://boardgamegeek.com/boardgame/9209/ticket-to-ride">
      <meta property="og:title" content="Ticket to Ride (2004) | BoardGameGeek">
      <meta property="og:description" content="Build railway routes &amp; connect cities.">
      <meta property="og:image" content="https://cf.geekdo-images.com/ticket/pic.jpg">
    </head>
    <body>
      <script>
        {"yearpublished":{"value":"2004"},"minplayers":"2","maxplayers":"5",
        "minplaytime":"30","maxplaytime":"60","averageweight":"1.83",
        "average":"7.4"},
        {"type":"boardgamecategory","value":"Trains"},
        {"value":"Network and Route Building","type":"boardgamemechanic"},
        {"type":"boardgamefamily","value":"Series: Ticket to Ride"}
      </script>
    </body>
  </html>
`;

describe("parseBggHtmlPage", () => {
  it("extracts bounded metadata from public BGG page markup", () => {
    expect(parseBggHtmlPage(ticketToRideHtml, 9209)).toEqual({
      bggId: 9209,
      bggRating: 7.4,
      categories: ["Trains"],
      description: "Build railway routes & connect cities.",
      expandsBggIds: [],
      expansionBggIds: [],
      families: ["Series: Ticket to Ride"],
      imageUrl: "https://cf.geekdo-images.com/ticket/pic.jpg",
      isExpansion: false,
      maxPlayers: 5,
      maxPlaytime: 60,
      mechanics: ["Network and Route Building"],
      minPlayers: 2,
      minPlaytime: 30,
      name: "Ticket to Ride",
      weight: 1.83,
      yearPublished: 2004,
    });
  });

  it("identifies expansions from their public canonical URL", () => {
    const html = ticketToRideHtml
      .replaceAll("/boardgame/9209/", "/boardgameexpansion/53383/")
      .replace("Ticket to Ride (2004)", "Ticket to Ride: Europa 1912 (2009)");

    expect(parseBggHtmlPage(html, 53_383)?.isExpansion).toBe(true);
  });

  it("rejects markup belonging to another BGG record", () => {
    expect(parseBggHtmlPage(ticketToRideHtml, 13)).toBeNull();
  });

  it.each([
    "",
    '<title>Just a moment...</title><div id="cf-chl-widget"></div>',
    `<meta property="og:title" content="Missing identity">${"x".repeat(5_000_001)}`,
  ])("rejects blocked, empty, or oversized markup", (html) => {
    expect(parseBggHtmlPage(html, 9209)).toBeNull();
  });

  it("rejects artwork outside BGG's image CDN", () => {
    const html = ticketToRideHtml.replace(
      "https://cf.geekdo-images.com/ticket/pic.jpg",
      "https://example.com/untrusted.jpg",
    );

    expect(parseBggHtmlPage(html, 9209)?.imageUrl).toBeNull();
  });
});

const magicItemResponse = {
  item: {
    imageurl: "https://cf.geekdo-images.com/magic/pic.jpg",
    links: {
      boardgamecategory: [
        { name: "Card Game" },
        { name: "Collectible Components" },
      ],
      boardgamefamily: [{ name: "Game: Magic The Gathering" }],
      boardgamemechanic: [{ name: "Deck Construction" }],
    },
    maxplayers: "6",
    maxplaytime: "20",
    minplayers: "2",
    minplaytime: "20",
    name: "Magic: The Gathering",
    objectid: 463,
    short_description:
      "Cast spells &amp; summon fantasy monsters in the original collectible card game.",
    subtypes: ["boardgame", "boardgameintegration"],
    yearpublished: "1993",
  },
};

const magicDynamicResponse = {
  item: {
    stats: {
      average: "7.59719",
      avgweight: "3.286",
    },
  },
};

describe("parseBggJsonResponses", () => {
  it("extracts Magic: The Gathering from BGG's public JSON responses", () => {
    expect(
      parseBggJsonResponses(magicItemResponse, magicDynamicResponse, 463),
    ).toEqual({
      bggId: 463,
      bggRating: 7.59719,
      categories: ["Card Game", "Collectible Components"],
      description:
        "Cast spells & summon fantasy monsters in the original collectible card game.",
      expandsBggIds: [],
      expansionBggIds: [],
      families: ["Game: Magic The Gathering"],
      imageUrl: "https://cf.geekdo-images.com/magic/pic.jpg",
      isExpansion: false,
      maxPlayers: 6,
      maxPlaytime: 20,
      mechanics: ["Deck Construction"],
      minPlayers: 2,
      minPlaytime: 20,
      name: "Magic: The Gathering",
      weight: 3.286,
      yearPublished: 1993,
    });
  });

  it("keeps valid item details when dynamic statistics are unavailable", () => {
    expect(parseBggJsonResponses(magicItemResponse, null, 463)).toEqual(
      expect.objectContaining({
        bggRating: null,
        name: "Magic: The Gathering",
        weight: null,
      }),
    );
  });

  it("treats an unrated complexity of zero as unknown", () => {
    expect(
      parseBggJsonResponses(
        magicItemResponse,
        { item: { stats: { average: "7.59719", avgweight: "0" } } },
        463,
      ),
    ).toEqual(expect.objectContaining({ bggRating: 7.59719, weight: null }));
  });

  it("extracts exact expansion relationships from BGG link identifiers", () => {
    const relationshipResponse = {
      item: {
        ...magicItemResponse.item,
        links: {
          ...magicItemResponse.item.links,
          boardgameexpansion: [
            { name: "Vudù: Double Trouble", objectid: "191182" },
          ],
          expandsboardgame: [
            { name: "Voodoo", objectid: 154_880 },
            { name: "Voodoo duplicate", objectid: 154_880 },
          ],
        },
      },
    };

    expect(parseBggJsonResponses(relationshipResponse, null, 463)).toEqual(
      expect.objectContaining({
        expandsBggIds: [154_880],
        expansionBggIds: [191_182],
      }),
    );
  });

  it("rejects malformed or unrelated item responses", () => {
    expect(
      parseBggJsonResponses(magicItemResponse, magicDynamicResponse, 9209),
    ).toBeNull();
    expect(parseBggJsonResponses({ item: {} }, null, 463)).toBeNull();
  });
});
