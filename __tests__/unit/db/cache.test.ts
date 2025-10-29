/**
 * Unit Tests for Query Result Caching
 *
 * Tests:
 * - Query result caching with 5-minute TTL
 * - Cache invalidation on updates/deletes
 * - Memory-based cache (Map)
 * - Cache hit/miss behavior
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Query Result Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Cache Storage', () => {
    it('should create cache with Map storage', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');

      // ACT
      const cache = new QueryCache();

      // ASSERT
      expect(cache).toBeDefined();
      expect(cache.size()).toBe(0);
    });

    it('should store query result in cache', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      const key = 'project:123';
      const value = { id: '123', title: 'Test Project' };

      // ACT
      cache.set(key, value);

      // ASSERT
      expect(cache.has(key)).toBe(true);
      expect(cache.get(key)).toEqual(value);
    });

    it('should retrieve cached result', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      const key = 'user:456';
      const value = { id: '456', name: 'John Doe' };
      cache.set(key, value);

      // ACT
      const result = cache.get(key);

      // ASSERT
      expect(result).toEqual(value);
    });

    it('should return undefined for cache miss', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();

      // ACT
      const result = cache.get('non-existent-key');

      // ASSERT
      expect(result).toBeUndefined();
    });
  });

  describe('Cache TTL (5 minutes)', () => {
    it('should set TTL to 5 minutes (300000ms)', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      const key = 'project:789';
      const value = { id: '789', title: 'TTL Test' };

      // ACT
      cache.set(key, value);
      const entry = cache.getEntry(key);

      // ASSERT
      expect(entry).toBeDefined();
      expect(entry?.expiresAt).toBeDefined();
      expect(entry?.expiresAt! - Date.now()).toBeCloseTo(300000, -2); // ~5 minutes
    });

    it('should expire cache entry after TTL', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      const key = 'expired:123';
      const value = { id: '123', data: 'test' };

      // ACT
      cache.set(key, value);
      // Manually set expiry to past
      const entry = cache.getEntry(key);
      if (entry) {
        entry.expiresAt = Date.now() - 1000; // Expired 1 second ago
      }

      // ASSERT
      expect(cache.get(key)).toBeUndefined(); // Should return undefined for expired
      expect(cache.isExpired(key)).toBe(true);
    });

    it('should not return expired entries', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      const key = 'test:expired';
      cache.set(key, { data: 'old' });

      // Mock time passing (5+ minutes)
      jest.useFakeTimers();
      jest.advanceTimersByTime(301000); // 5 minutes + 1 second

      // ACT
      const result = cache.get(key);

      // ASSERT
      expect(result).toBeUndefined();

      jest.useRealTimers();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate single cache entry', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      cache.set('project:123', { id: '123' });
      cache.set('project:456', { id: '456' });

      // ACT
      cache.invalidate('project:123');

      // ASSERT
      expect(cache.has('project:123')).toBe(false);
      expect(cache.has('project:456')).toBe(true); // Other entry unaffected
    });

    it('should invalidate by pattern', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      cache.set('project:123', { id: '123' });
      cache.set('project:456', { id: '456' });
      cache.set('user:789', { id: '789' });

      // ACT
      cache.invalidatePattern('project:*');

      // ASSERT
      expect(cache.has('project:123')).toBe(false);
      expect(cache.has('project:456')).toBe(false);
      expect(cache.has('user:789')).toBe(true); // Different pattern
    });

    it('should clear all cache', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      cache.set('key1', { data: '1' });
      cache.set('key2', { data: '2' });
      cache.set('key3', { data: '3' });

      // ACT
      cache.clear();

      // ASSERT
      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', async () => {
      // ARRANGE
      const { generateCacheKey } = await import('@/lib/db/cache');

      // ACT
      const key1 = generateCacheKey('project', '123');
      const key2 = generateCacheKey('project', '123');

      // ASSERT
      expect(key1).toBe(key2);
      expect(key1).toBe('project:123');
    });

    it('should generate unique keys for different resources', async () => {
      // ARRANGE
      const { generateCacheKey } = await import('@/lib/db/cache');

      // ACT
      const projectKey = generateCacheKey('project', '123');
      const userKey = generateCacheKey('user', '123');

      // ASSERT
      expect(projectKey).not.toBe(userKey);
    });

    it('should include query params in cache key', async () => {
      // ARRANGE
      const { generateCacheKey } = await import('@/lib/db/cache');

      // ACT
      const key1 = generateCacheKey('project', 'list', { status: 'IN_PROGRESS' });
      const key2 = generateCacheKey('project', 'list', { status: 'COMPLETE' });

      // ASSERT
      expect(key1).not.toBe(key2);
      expect(key1).toContain('status="IN_PROGRESS"');
      expect(key2).toContain('status="COMPLETE"');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      cache.set('key1', { data: 'test' });

      // ACT
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      const stats = cache.getStats();

      // ASSERT
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();

      // ACT
      cache.get('non-existent-1'); // Miss
      cache.get('non-existent-2'); // Miss
      const stats = cache.getStats();

      // ASSERT
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      cache.set('key1', { data: 'test' });

      // ACT
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      const stats = cache.getStats();

      // ASSERT
      expect(stats.hitRate).toBeCloseTo(0.6667, 2); // 2 hits / 3 total = 66.67%
    });
  });

  describe('Cached Query Wrapper', () => {
    it('should cache query result on first call', async () => {
      // ARRANGE
      const { cachedQuery } = await import('@/lib/db/cache');
      const queryFn = jest.fn().mockResolvedValue({ id: '123', data: 'test' });
      const cacheKey = 'test:123';

      // ACT
      const result1 = await cachedQuery(cacheKey, queryFn);
      const result2 = await cachedQuery(cacheKey, queryFn);

      // ASSERT
      expect(queryFn).toHaveBeenCalledTimes(1); // Only called once
      expect(result1).toEqual(result2);
    });

    it('should use cached result on subsequent calls', async () => {
      // ARRANGE
      const { cachedQuery } = await import('@/lib/db/cache');
      const queryFn = jest.fn().mockResolvedValue({ count: 1 });
      const cacheKey = 'query:count';

      // ACT
      await cachedQuery(cacheKey, queryFn);
      await cachedQuery(cacheKey, queryFn);
      await cachedQuery(cacheKey, queryFn);

      // ASSERT
      expect(queryFn).toHaveBeenCalledTimes(1); // Query executed once, cached twice
    });

    it('should re-query after cache invalidation', async () => {
      // ARRANGE
      const { cachedQuery, invalidateCache } = await import('@/lib/db/cache');
      const queryFn = jest.fn().mockResolvedValue({ version: 1 });
      const cacheKey = 'version:check';

      // ACT
      await cachedQuery(cacheKey, queryFn);
      invalidateCache(cacheKey);
      await cachedQuery(cacheKey, queryFn);

      // ASSERT
      expect(queryFn).toHaveBeenCalledTimes(2); // Called again after invalidation
    });
  });

  describe('Memory Management', () => {
    it('should report cache size', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();

      // ACT
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });
      cache.set('key3', { data: 'test3' });

      // ASSERT
      expect(cache.size()).toBe(3);
    });

    it('should clean up expired entries', async () => {
      // ARRANGE
      const { QueryCache } = await import('@/lib/db/cache');
      const cache = new QueryCache();
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });

      // Manually expire one entry
      const entry = cache.getEntry('key1');
      if (entry) {
        entry.expiresAt = Date.now() - 1000;
      }

      // ACT
      cache.cleanup(); // Remove expired entries

      // ASSERT
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.size()).toBe(1);
    });
  });
});
