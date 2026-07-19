import { describe, expect, it } from "vitest";

import english from "../../../../messages/en.json";
import italian from "../../../../messages/it.json";

type MessageTree = { [key: string]: MessageTree | string };

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
