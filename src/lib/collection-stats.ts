import { isExpansionCategory } from "@/lib/game-taxonomy";

/** Minimum collection shape required for aggregate statistics. */
export type StatGame = {
  bggId: number;
  categories: string[];
  favorite: boolean;
  isExpansion: boolean;
  mechanics: string[];
  moneySpent: number;
  name: string;
  weight: number | null;
};

/** One labeled count used by category and mechanic charts. */
export type CountDatum = { name: string; value: number };

/** Computes deterministic user-facing insights from owned collection data. */
export function calculateCollectionStats(collection: StatGame[]) {
  const priced = collection
    .filter((game) => game.moneySpent > 0)
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

  return {
    totalItems: collection.length,
    baseGames: collection.filter((game) => !game.isExpansion).length,
    expansions: collection.filter((game) => game.isExpansion).length,
    favorites: collection.filter((game) => game.favorite).length,
    pricedItems: priced.length,
    totalSpent: sum(collection.map((game) => game.moneySpent)),
    averageSpent: priced.length
      ? sum(priced.map((game) => game.moneySpent)) / priced.length
      : 0,
    medianSpent,
    mostExpensive: priced.slice(0, 7).map((game) => ({
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
    complexity: [
      {
        key: "light" as const,
        value: collection.filter(
          (game) => game.weight !== null && game.weight <= 2,
        ).length,
      },
      {
        key: "medium" as const,
        value: collection.filter(
          (game) => game.weight !== null && game.weight > 2 && game.weight <= 3,
        ).length,
      },
      {
        key: "heavy" as const,
        value: collection.filter(
          (game) => game.weight !== null && game.weight > 3 && game.weight <= 4,
        ).length,
      },
      {
        key: "expert" as const,
        value: collection.filter(
          (game) => game.weight !== null && game.weight > 4,
        ).length,
      },
    ],
  };
}

/** Sums a list without leaking floating-point noise into serialized output. */
function sum(values: number[]): number {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
}

/** Counts normalized labels and orders them by frequency then alphabetically. */
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
