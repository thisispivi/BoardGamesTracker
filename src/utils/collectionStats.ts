import type {
  CollectionStats,
  CountDatum,
  DecadeDatum,
  PlayerCountDatum,
  PlaytimeBand,
  PlaytimeDatum,
  StatGame,
} from "@/core";
import { isExpansionCategory } from "@/utils/gameTaxonomy";
import { gameWeightBands, getGameWeightBand } from "@/utils/gameWeight";

/** Largest exact table size charted before counts fold into an open band. */
const maxChartedPlayers = 8;

/** Earliest publication year treated as a real date rather than missing data. */
const earliestCredibleYear = 1900;

/** Exclusive upper minute bounds for every session band except the last. */
const playtimeBandCeilings: readonly [PlaytimeBand, number][] = [
  ["quick", 30],
  ["short", 60],
  ["medium", 120],
];

/**
 * Computes deterministic user-facing insights from owned collection data.
 *
 * Session-shaped figures — table size, duration, and publication decade — count
 * base games only, because an expansion inherits the table it is played on and
 * would otherwise count the same evening twice.
 *
 * @param collection - The collection items to analyze.
 * @returns The calculated collection stats.
 */
export function calculateCollectionStats(
  collection: StatGame[],
): CollectionStats {
  const baseGames = collection.filter((game) => !game.isExpansion);
  const priced = collection
    .filter((game) => game.moneySpent > 0 || game.gifted)
    .toSorted((left, right) => right.moneySpent - left.moneySpent);
  const prices = priced
    .map((game) => game.moneySpent)
    .toSorted((a, b) => a - b);
  const middle = Math.floor(prices.length / 2);
  const medianSpent =
    prices.length === 0
      ? 0
      : prices.length % 2 === 0
        ? ((prices[middle - 1] ?? 0) + (prices[middle] ?? 0)) / 2
        : (prices[middle] ?? 0);
  const weights = collection
    .map((game) => game.weight)
    .filter((weight): weight is number => weight !== null);
  const playtimes = baseGames
    .map(getPlaytime)
    .filter((minutes): minutes is number => minutes !== null);

  return {
    totalItems: collection.length,
    baseGames: baseGames.length,
    expansions: collection.length - baseGames.length,
    favorites: collection.filter((game) => game.favorite).length,
    pricedItems: priced.length,
    totalSpent: sum(collection.map((game) => game.moneySpent)),
    averageSpent: priced.length
      ? sum(priced.map((game) => game.moneySpent)) / priced.length
      : 0,
    medianSpent,
    averageWeight: average(weights),
    averagePlaytime: average(playtimes),
    mostExpensive: priced
      .filter((game) => !game.gifted)
      .slice(0, 7)
      .map((game) => ({
        name: game.name,
        value: game.moneySpent,
      })),
    categories: countLabels(
      collection.flatMap((game) =>
        game.categories.filter((category) => !isExpansionCategory(category)),
      ),
    ).slice(0, 8),
    mechanics: countLabels(collection.flatMap((game) => game.mechanics)).slice(
      0,
      8,
    ),
    complexity: countWeightBands(collection),
    playerCounts: countPlayerCounts(baseGames),
    playtime: countPlaytimeBands(baseGames),
    decades: countDecades(baseGames),
  };
}

/**
 * Counts rated games per complexity band, keeping every band in the output.
 *
 * Empty bands are retained so the chart keeps a stable four-column shape
 * instead of silently changing scale as a collection grows.
 *
 * @param collection - The collection items to analyze.
 * @returns One count per band, in ascending complexity order.
 */
function countWeightBands(
  collection: StatGame[],
): CollectionStats["complexity"] {
  const counts = new Map(gameWeightBands.map((band) => [band, 0]));
  for (const game of collection) {
    const band = getGameWeightBand(game.weight);
    if (band !== null) {
      counts.set(band, (counts.get(band) ?? 0) + 1);
    }
  }
  return gameWeightBands.map((key) => ({ key, value: counts.get(key) ?? 0 }));
}

/**
 * Counts how many games seat each exact table size from one upwards.
 *
 * A game counts for every size inside its inclusive player range, so the
 * columns intentionally sum to more than the collection. The final column is an
 * open band collecting every size at or above it.
 *
 * @param baseGames - Base games with a declared player range.
 * @returns One count per table size, in ascending order.
 */
function countPlayerCounts(baseGames: StatGame[]): PlayerCountDatum[] {
  const counts = new Map<number, number>();
  for (let players = 1; players <= maxChartedPlayers; players += 1) {
    counts.set(players, 0);
  }
  for (const game of baseGames) {
    if (game.minPlayers <= 0 || game.maxPlayers <= 0) continue;
    const lowest = Math.max(1, Math.min(game.minPlayers, maxChartedPlayers));
    const highest = Math.min(
      Math.max(game.maxPlayers, lowest),
      maxChartedPlayers,
    );
    for (let players = lowest; players <= highest; players += 1) {
      counts.set(players, (counts.get(players) ?? 0) + 1);
    }
  }
  return [...counts].map(([players, value]) => ({ players, value }));
}

/**
 * Groups games into session-length bands, keeping every band in the output.
 *
 * @param baseGames - Base games whose declared duration is classified.
 * @returns One count per band, in ascending duration order.
 */
function countPlaytimeBands(baseGames: StatGame[]): PlaytimeDatum[] {
  const counts = new Map<PlaytimeBand, number>([
    ["quick", 0],
    ["short", 0],
    ["medium", 0],
    ["long", 0],
  ]);
  for (const game of baseGames) {
    const minutes = getPlaytime(game);
    if (minutes === null) continue;
    const band =
      playtimeBandCeilings.find(([, ceiling]) => minutes < ceiling)?.[0] ??
      "long";
    counts.set(band, (counts.get(band) ?? 0) + 1);
  }
  return [...counts].map(([key, value]) => ({ key, value }));
}

/**
 * Counts publications per decade across the range the collection spans.
 *
 * Decades without a game are kept between the first and last populated decade
 * so the timeline stays evenly spaced instead of compressing empty years away.
 *
 * @param baseGames - Base games whose publication year is classified.
 * @returns One count per decade, in ascending chronological order.
 */
function countDecades(baseGames: StatGame[]): DecadeDatum[] {
  const counts = new Map<number, number>();
  for (const game of baseGames) {
    const year = game.yearPublished;
    if (year === null || year < earliestCredibleYear) continue;
    const decade = Math.floor(year / 10) * 10;
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
  }
  const decades = [...counts.keys()].toSorted((left, right) => left - right);
  const first = decades[0];
  const last = decades.at(-1);
  if (first === undefined || last === undefined) return [];
  const timeline: DecadeDatum[] = [];
  for (let decade = first; decade <= last; decade += 10) {
    timeline.push({ decade, value: counts.get(decade) ?? 0 });
  }
  return timeline;
}

/**
 * Reads a game's representative session length in minutes.
 *
 * The upper bound is preferred because it describes a full game rather than the
 * best case, and the lower bound is the fallback when only it is recorded.
 *
 * @param game - The game whose declared duration is read.
 * @returns The duration in minutes, or null when none is recorded.
 */
function getPlaytime(game: StatGame): number | null {
  if (game.maxPlaytime > 0) return game.maxPlaytime;
  if (game.minPlaytime > 0) return game.minPlaytime;
  return null;
}

/**
 * Averages a list, distinguishing an empty sample from a genuine zero.
 *
 * @param values - The values to average.
 * @returns The mean rounded to two decimals, or null when there is no sample.
 */
function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((sum(values) / values.length).toFixed(2));
}

/**
 * Sums a list without leaking floating-point noise into serialized output.
 *
 * @param values - The values to process.
 * @returns The arithmetic sum of the provided values.
 */
function sum(values: number[]): number {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
}

/**
 * Counts normalized labels and orders them by frequency then alphabetically.
 *
 * @param labels - The labels to count.
 * @returns Label counts sorted by frequency and name.
 */
function countLabels(labels: string[]): CountDatum[] {
  const counts = new Map<string, number>();
  for (const rawLabel of labels) {
    const label = rawLabel.trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, value]) => ({ name, value }))
    .toSorted((left, right) =>
      right.value === left.value
        ? left.name.localeCompare(right.name)
        : right.value - left.value,
    );
}
