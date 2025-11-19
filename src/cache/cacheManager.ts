import { LRUCache } from "lru-cache";
import type { User, CacheStats, CacheEntry } from "../types/index.js";

export class CacheManager {
  private cache: LRUCache<number, CacheEntry<User>>;
  private stats = {
    hits: 0,
    misses: 0,
    responseTimes: [] as number[],
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private ttlMs: number;

  /**
   * Initialize cache manager with TTL
   */
  constructor(ttlSeconds: number = 60) {
    this.ttlMs = ttlSeconds * 1000;
    this.cache = new LRUCache<number, CacheEntry<User>>({
      max: 1000,
      ttl: this.ttlMs,
      updateAgeOnGet: false,
      ttlAutopurge: true,
    });

    this.startCleanupTask();
  }

  /**
   * Get user from cache
   */
  get(userId: number): User | null {
    const entry = this.cache.get(userId);
    if (entry) {
      this.stats.hits++;
      return entry.data;
    }
    this.stats.misses++;
    return null;
  }

  /**
   * Set user in cache
   */
  set(userId: number, user: User): void {
    const entry: CacheEntry<User> = {
      data: user,
      timestamp: Date.now(),
    };
    this.cache.set(userId, entry);
  }

  /**
   * Check if user exists in cache
   */
  has(userId: number): boolean {
    return this.cache.has(userId);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const averageResponseTime =
      this.stats.responseTimes.length > 0
        ? this.stats.responseTimes.reduce((a, b) => a + b, 0) /
          this.stats.responseTimes.length
        : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    };
  }

  /**
   * Record response time for statistics
   */
  recordResponseTime(timeMs: number): void {
    this.stats.responseTimes.push(timeMs);
    if (this.stats.responseTimes.length > 1000) {
      this.stats.responseTimes.shift();
    }
  }

  /**
   * Start background task to clear stale cache entries
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const sizeBefore = this.cache.size;
      this.cache.purgeStale();
      const sizeAfter = this.cache.size;
      const removed = sizeBefore - sizeAfter;

      if (removed > 0) {
        console.log(
          `[Cache Cleanup] Removed ${removed} expired entries (size: ${sizeBefore} → ${sizeAfter})`
        );
      }
    }, 10000);
  }

  /**
   * Stop cleanup task
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Singleton instance
 */
export const cacheManager = new CacheManager(60);
