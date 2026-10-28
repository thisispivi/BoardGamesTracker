import "server-only";

/** Mutable request count and expiry for one rate-limit key. */
type RateLimitEntry = {
  count: number;
  resetsAt: number;
};

/** Bounded counters for every key sharing one namespace. */
type RateLimitStore = {
  entries: Map<string, RateLimitEntry>;
  nextSweepAt: number;
};

const maxEntriesPerNamespace = 10_000;
const sweepIntervalMs = 60_000;
const stores = new Map<string, RateLimitStore>();

/**
 * Returns the store for a key's namespace, the text before its first colon.
 *
 * Each namespace is capped separately, so a flood of distinct keys in one
 * namespace, such as client addresses, can only evict counters of that same
 * namespace and never resets an unrelated security allowance.
 *
 * @param key - Stable actor and operation identifier.
 * @returns The store owning the key, created on first use.
 */
function getStore(key: string): RateLimitStore {
  const separator = key.indexOf(":");
  const namespace = separator === -1 ? key : key.slice(0, separator);
  const existing = stores.get(namespace);
  if (existing) {
    return existing;
  }

  const created: RateLimitStore = { entries: new Map(), nextSweepAt: 0 };
  stores.set(namespace, created);
  return created;
}

/**
 * Removes expired entries and, at capacity, the oldest remaining entries.
 *
 * @param store - The namespace store to prune.
 * @param now - Current timestamp used to evaluate and refresh the rate-limit window.
 * @param enforceCapacity - Whether the in-memory limiter must evict excess keys.
 * @returns Nothing.
 */
function sweepEntries(
  store: RateLimitStore,
  now: number,
  enforceCapacity: boolean,
): void {
  if (now < store.nextSweepAt && !enforceCapacity) {
    return;
  }

  for (const [key, entry] of store.entries) {
    if (entry.resetsAt <= now) {
      store.entries.delete(key);
    }
  }
  store.nextSweepAt = now + sweepIntervalMs;

  while (store.entries.size >= maxEntriesPerNamespace) {
    const oldestKey = store.entries.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    store.entries.delete(oldestKey);
  }
}

/**
 * Consumes one allowance from an in-memory fixed-window rate limit.
 *
 * This limiter is intentionally per application instance. Multi-instance
 * deployments need a shared rate-limit store to enforce a global limit.
 *
 * @param key - Stable actor and operation identifier, `namespace:actor`.
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

  const store = getStore(key);
  const now = Date.now();
  const current = store.entries.get(key);
  if (!current || current.resetsAt <= now) {
    sweepEntries(
      store,
      now,
      !current && store.entries.size >= maxEntriesPerNamespace,
    );
    store.entries.delete(key);
    store.entries.set(key, { count: 1, resetsAt: now + windowMs });
    return true;
  }

  current.count += 1;
  return current.count <= limit;
}
