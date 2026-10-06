import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  env: { BETTER_AUTH_SECRET: "selection-token-test-secret-0123456789" },
}));

import type { GameSelection } from "@/core";
import {
  createSelectionToken,
  verifySelectionToken,
} from "@/server/discovery/selectionToken";

const selection: GameSelection = {
  bggId: 224517,
  imageUrl: "https://cf.geekdo-images.com/cover.jpg",
  isExpansion: false,
  name: "Brass: Birmingham",
  yearPublished: 2018,
};

/**
 * Re-encodes a token payload so a tampered claim keeps a valid structure.
 *
 * @param token - A token produced by the signer.
 * @param changes - Payload fields to overwrite before re-encoding.
 * @returns The token with a rewritten payload and its original signature.
 */
function tamper(token: string, changes: Record<string, unknown>): string {
  const [payload = "", signature = ""] = token.split(".");
  const decoded: unknown = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  );
  const forged = Buffer.from(
    JSON.stringify({ ...(decoded as object), ...changes }),
  ).toString("base64url");
  return `${forged}.${signature}`;
}

describe("selection tokens", () => {
  it("round-trips the signed game identity", () => {
    expect(verifySelectionToken(createSelectionToken(selection))).toEqual(
      selection,
    );
  });

  it("rejects a payload edited after signing", () => {
    const forged = tamper(createSelectionToken(selection), { bggId: 1 });

    expect(verifySelectionToken(forged)).toBeNull();
  });

  it("rejects a token whose expiry has passed", () => {
    vi.useFakeTimers();
    try {
      const token = createSelectionToken(selection);
      vi.advanceTimersByTime(2 * 60 * 60 * 1_000);

      expect(verifySelectionToken(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects malformed, unsigned, and multi-segment tokens", () => {
    const [payload = ""] = createSelectionToken(selection).split(".");

    expect(verifySelectionToken("")).toBeNull();
    expect(verifySelectionToken(payload)).toBeNull();
    expect(verifySelectionToken(`${payload}.`)).toBeNull();
    expect(verifySelectionToken(`${payload}.aaaa`)).toBeNull();
    expect(
      verifySelectionToken(`${createSelectionToken(selection)}.extra`),
    ).toBeNull();
  });

  it("refuses artwork that is not hosted by the BoardGameGeek CDN", () => {
    const forged = tamper(createSelectionToken(selection), {
      imageUrl: "https://attacker.example/cover.jpg",
    });

    expect(verifySelectionToken(forged)).toBeNull();
  });
});
