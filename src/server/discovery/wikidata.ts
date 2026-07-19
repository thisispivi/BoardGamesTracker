import "server-only";

import { wikidataResponseSchema } from "@/core";

/** Retrieves open publication years keyed by BoardGameGeek ID from Wikidata. */
export async function getWikidataYears(
  bggIds: number[],
): Promise<Map<number, number>> {
  if (bggIds.length === 0) {
    return new Map();
  }

  const values = [...new Set(bggIds)]
    .slice(0, 20)
    .map((id) => `"${id}"`)
    .join(" ");
  const query = `SELECT ?bggId ?date WHERE {
    VALUES ?bggId { ${values} }
    ?item wdt:P2339 ?bggId.
    OPTIONAL { ?item wdt:P577 ?publication. }
    OPTIONAL { ?item wdt:P571 ?inception. }
    BIND(COALESCE(?publication, ?inception) AS ?date)
  }`;
  const endpoint = new URL("https://query.wikidata.org/sparql");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("query", query);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted board-game collection)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    return new Map();
  }

  const parsed = wikidataResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return new Map();
  }

  const years = new Map<number, number>();
  for (const binding of parsed.data.results.bindings) {
    const bggId = Number(binding.bggId.value);
    const year = binding.date
      ? new Date(binding.date.value).getUTCFullYear()
      : Number.NaN;
    if (
      Number.isSafeInteger(bggId) &&
      Number.isSafeInteger(year) &&
      year >= 1800 &&
      year <= 2200 &&
      !years.has(bggId)
    ) {
      years.set(bggId, year);
    }
  }
  return years;
}
