import { describe, expect, it } from "vitest";

import english from "./en.json";
import italian from "./it.json";

/** A recursively nested translation catalog. */
type MessageTree = { [key: string]: MessageTree | string };

/**
 * Flattens a nested message catalog into dot-qualified translation keys.
 *
 * @param tree - Message catalog branch to flatten.
 * @param prefix - Key path accumulated from parent branches.
 * @returns Message strings keyed by their complete translation path.
 */
function flattenMessages(
  tree: MessageTree,
  prefix = "",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? [[path, value]]
        : Object.entries(flattenMessages(value, path));
    }),
  );
}

/**
 * Extracts the distinct ICU argument names referenced by a message.
 *
 * @param message - ICU message whose arguments are inspected.
 * @returns Sorted argument names used by the message.
 */
function messageArguments(message: string): string[] {
  return [
    ...new Set(
      [...message.matchAll(/\{([A-Za-z][\w]*)\s*(?:,|\})/g)].flatMap((match) =>
        match[1] ? [match[1]] : [],
      ),
    ),
  ].sort();
}

describe("next-intl catalogs", () => {
  const source = flattenMessages(english);
  const translation = flattenMessages(italian);

  it("keeps every locale structurally complete", () => {
    expect(Object.keys(translation).sort()).toEqual(Object.keys(source).sort());
  });

  it("keeps ICU arguments consistent between locales", () => {
    for (const [key, message] of Object.entries(source)) {
      expect(messageArguments(translation[key] ?? ""), key).toEqual(
        messageArguments(message),
      );
    }
  });
});
