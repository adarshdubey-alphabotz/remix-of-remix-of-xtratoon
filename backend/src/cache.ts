/**
 * LRU cache with TTL for caching file chunks and metadata in RAM.
 */
export class LRUCache<V> {
  private cache = new Map<string, { value: V; expires: number; size: number }>();
  private currentSize = 0;

  constructor(
    private maxSize: number, // in bytes for buffer caches, count for others
    private defaultTtl: number, // in ms
    private sizeMode: "bytes" | "count" = "count"
  ) {}

  get(key: string): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, ttl?: number, size?: number): void {
    this.delete(key); // Remove old entry if exists

    const entrySize = size ?? (this.sizeMode === "bytes" && Buffer.isBuffer(value) ? (value as Buffer).length : 1);

    // Evict until we have space
    while (this.currentSize + entrySize > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl ?? this.defaultTtl),
      size: entrySize,
    });
    this.currentSize += entrySize;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    this.currentSize -= entry.size;
    return this.cache.delete(key);
  }

  get stats() {
    return {
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      hitRate: 0, // could track hits/misses
    };
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
}
