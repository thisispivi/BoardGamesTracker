type CacheEntry<TValue> = {
  expiresAt: number;
  value: TValue;
};

/**
 * Bounded time-to-live cache backed by insertion-ordered `Map` eviction.
 *
 * Entries expire lazily on read and the least recently used entry is evicted at
 * capacity, so the cache never grows without bound.
 */
export class TtlCache<TValue> {
  readonly #entries = new Map<string, CacheEntry<TValue>>();
  readonly #maxEntries: number;
  readonly #ttlMs: number;

  /**
   * Creates a cache with a fixed entry lifetime and capacity.
   *
   * @param ttlMs - Entry lifetime in milliseconds.
   * @param maxEntries - Maximum retained entries before oldest-first eviction.
   */
  constructor(ttlMs: number, maxEntries = 200) {
    this.#ttlMs = ttlMs;
    this.#maxEntries = maxEntries;
  }

  /**
   * Reads a live entry, dropping it when its lifetime has elapsed.
   *
   * @param key - Stable cache key.
   * @returns The cached value, or undefined when absent or expired.
   */
  get(key: string): TValue | undefined {
    const entry = this.#entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.#entries.delete(key);
      return undefined;
    }
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  /**
   * Stores a value and evicts the oldest entries once at capacity.
   *
   * @param key - Stable cache key.
   * @param value - The value to cache.
   * @returns The stored value, for call-site chaining.
   */
  set(key: string, value: TValue): TValue {
    this.#entries.delete(key);
    this.#entries.set(key, { expiresAt: Date.now() + this.#ttlMs, value });
    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.#entries.delete(oldestKey);
    }
    return value;
  }
}
