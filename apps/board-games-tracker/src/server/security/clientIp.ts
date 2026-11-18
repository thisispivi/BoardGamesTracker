import "server-only";

import { BlockList, isIP } from "node:net";

import { env } from "@/env";

/**
 * Reads the IP family of an address.
 *
 * @param address - The address to classify.
 * @returns The block-list family, or null when the address is not an IP.
 */
function familyOf(address: string): "ipv4" | "ipv6" | null {
  const version = isIP(address);
  return version === 4 ? "ipv4" : version === 6 ? "ipv6" : null;
}

/**
 * Parses the configured reverse proxies into a lookup list.
 *
 * A malformed entry stops the application at startup instead of silently
 * trusting nothing, which would leave every client sharing one rate limit.
 *
 * @param raw - Comma-separated addresses or CIDR ranges.
 * @returns The validated entries and a list that matches addresses against them.
 */
function parseTrustedProxies(raw: string | undefined): {
  entries: string[];
  list: BlockList;
} {
  const list = new BlockList();
  const entries = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const entry of entries) {
    const [address = "", prefix, extra] = entry.split("/");
    const family = familyOf(address);
    const bits = prefix === undefined ? undefined : Number(prefix);
    const maxBits = family === "ipv4" ? 32 : 128;
    if (
      !family ||
      extra !== undefined ||
      (bits !== undefined &&
        (prefix === "" ||
          !Number.isInteger(bits) ||
          bits < 0 ||
          bits > maxBits))
    ) {
      throw new Error(`TRUSTED_PROXIES contains an invalid entry: ${entry}`);
    }
    if (bits === undefined) {
      list.addAddress(address, family);
    } else {
      list.addSubnet(address, bits, family);
    }
  }
  return { entries, list };
}

const trusted = parseTrustedProxies(env.TRUSTED_PROXIES);

/** Reverse proxies whose forwarding headers are trusted, as configured. */
export const trustedProxies = trusted.entries;

/**
 * Resolves the client address from an `X-Forwarded-For` chain.
 *
 * Each proxy appends the address it received the request from, so the chain is
 * read from the right: configured proxies are skipped and the first other hop
 * is the client. Entries left of it were written by the client and are ignored.
 *
 * @param forwardedFor - The `X-Forwarded-For` header, when present.
 * @returns The client address, or null when the chain names none.
 */
export function resolveClientIp(forwardedFor: string | null): string | null {
  const hops = (forwardedFor ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  for (let index = hops.length - 1; index >= 0; index -= 1) {
    const hop = hops[index] ?? "";
    const family = familyOf(hop);
    if (!family) return null;
    if (!trusted.list.check(hop, family)) return hop;
  }
  return null;
}
