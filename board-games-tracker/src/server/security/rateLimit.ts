import "server-only";

/** Mutable request count and expiry for one rate-limit key. */
type RateLimitEntry = {
  count: number;
  resetsAt: number;
};

const maxEntries = 10_000;
const sweepIntervalMs = 60_000;
const entries = new Map<string, RateLimitEntry>();
let nextSweepAt = 0;

/**
 * Removes expired entries and, at capacity, the oldest remaining entries.
 *
 * @param now - Current timestamp used to evaluate and refresh the rate-limit window.
 * @param enforceCapacity - Whether the in-memory limiter must evict excess keys.
 * @returns Nothing.
 */
function sweepEntries(now: number, enforceCapacity: boolean): void {
  if (now < nextSweepAt && !enforceCapacity) {
    return;
  }

  for (const [key, entry] of entries) {
    if (entry.resetsAt <= now) {
      entries.delete(key);
    }
  }
  nextSweepAt = now + sweepIntervalMs;

  while (entries.size >= maxEntries) {
    const oldestKey = entries.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    entries.delete(oldestKey);
  }
}

/**
 * Consumes one allowance from an in-memory fixed-window rate limit.
 *
 * This limiter is intentionally per application instance. Multi-instance
 * deployments need a shared rate-limit store to enforce a global limit.
 *
 * @param key - Stable actor and operation identifier.
 * @param limit - Maximum accepted operations in the window.
 * @param windowMs - Fixed-window duration in milliseconds.
 * @returns Whether the operation remains within its limit.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  if (key === "" || limit < 1 || windowMs < 1) {
    return false;
  }

  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetsAt <= now) {
    sweepEntries(now, !current && entries.size >= maxEntries);
    entries.delete(key);
    entries.set(key, { count: 1, resetsAt: now + windowMs });
    return true;
  }

  current.count += 1;
  return current.count <= limit;
}
