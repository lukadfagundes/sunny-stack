/**
 * Query Result Caching
 *
 * Provides in-memory caching for database query results with:
 * - 5-minute TTL (time-to-live)
 * - Cache invalidation helpers
 * - Pattern-based invalidation
 * - Hit/miss statistics
 *
 * @module lib/db/cache
 */

/**
 * Cache entry with expiration timestamp
 */
interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000; // 300,000ms = 5 minutes

/**
 * Query Cache class
 *
 * Memory-based cache using Map for query result storage.
 */
export class QueryCache {
  private cache: Map<string, CacheEntry>;
  private hits: number;
  private misses: number;

  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Set cache entry with TTL
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - TTL in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttl: number = CACHE_TTL): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get cached value
   *
   * Returns undefined if:
   * - Key doesn't exist
   * - Entry is expired
   *
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    // Cache miss
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Cache hit
    this.hits++;
    return entry.value as T;
  }

  /**
   * Get cache entry (including metadata)
   *
   * @param key - Cache key
   * @returns Cache entry or undefined
   */
  getEntry(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  /**
   * Check if key exists and is not expired
   *
   * @param key - Cache key
   * @returns True if key exists and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Check if cache entry is expired
   *
   * @param key - Cache key
   * @returns True if expired or doesn't exist
   */
  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Invalidate single cache entry
   *
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate entries by pattern
   *
   * Supports wildcard (*) at the end of pattern.
   *
   * @param pattern - Pattern to match (e.g., 'project:*')
   */
  invalidatePattern(pattern: string): void {
    const isWildcard = pattern.endsWith('*');
    const prefix = isWildcard ? pattern.slice(0, -1) : pattern;

    for (const key of this.cache.keys()) {
      if (isWildcard) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      } else {
        if (key === pattern) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache size
   *
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate,
    };
  }

  /**
   * Clean up expired entries
   *
   * Removes all expired entries from cache.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global cache instance
 */
const globalCache = new QueryCache();

/**
 * Generate cache key
 *
 * Creates consistent cache keys from resource type, ID, and optional params.
 *
 * @param resource - Resource type (e.g., 'project', 'user')
 * @param identifier - Resource identifier
 * @param params - Optional query parameters
 * @returns Cache key string
 *
 * @example
 * ```typescript
 * generateCacheKey('project', '123') // 'project:123'
 * generateCacheKey('project', 'list', { status: 'ACTIVE' }) // 'project:list:status=ACTIVE'
 * ```
 */
export function generateCacheKey(
  resource: string,
  identifier: string,
  params?: Record<string, any>
): string {
  let key = `${resource}:${identifier}`;

  if (params) {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistency
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(':');
    key += `:${paramString}`;
  }

  return key;
}

/**
 * Execute query with caching
 *
 * Wraps a query function with caching logic:
 * 1. Check cache first
 * 2. If cache miss, execute query
 * 3. Store result in cache
 * 4. Return result
 *
 * @param cacheKey - Cache key for this query
 * @param queryFn - Query function to execute
 * @param ttl - TTL in milliseconds (default: 5 minutes)
 * @returns Query result (cached or fresh)
 *
 * @example
 * ```typescript
 * const user = await cachedQuery(
 *   'user:123',
 *   () => prisma.user.findUnique({ where: { id: '123' } })
 * );
 * ```
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  // Check cache first
  const cached = globalCache.get<T>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Execute query
  const result = await queryFn();

  // Store in cache
  globalCache.set(cacheKey, result, ttl);

  return result;
}

/**
 * Invalidate cache by key
 *
 * @param cacheKey - Cache key to invalidate
 */
export function invalidateCache(cacheKey: string): void {
  globalCache.invalidate(cacheKey);
}

/**
 * Invalidate cache by pattern
 *
 * @param pattern - Pattern to match (e.g., 'project:*')
 */
export function invalidateCachePattern(pattern: string): void {
  globalCache.invalidatePattern(pattern);
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Get cache statistics
 *
 * @returns Cache statistics
 */
export function getCacheStats(): CacheStats {
  return globalCache.getStats();
}

/**
 * Export global cache instance
 */
export { globalCache as cache };

/**
 * Export default for convenience
 */
export default globalCache;
