/**
 * @file Unit tests for DataLoader
 * @description Tests batching, caching, and error handling behavior
 */

import { DataLoader } from '@/lib/db/batch-loader';
import { DatabaseError } from '@/lib/errors/app-error';

describe('DataLoader', () => {
  describe('constructor', () => {
    it('should create a DataLoader with default options', () => {
      const loader = new DataLoader(async (keys) => keys);
      expect(loader).toBeInstanceOf(DataLoader);
    });

    it('should throw TypeError if batchFn is not a function', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        new DataLoader('not a function');
      }).toThrow(TypeError);
    });

    it('should accept custom options', () => {
      const loader = new DataLoader(async (keys) => keys, {
        cache: false,
        maxBatchSize: 50,
        name: 'TestLoader',
      });

      expect(loader.getCacheStats()).toEqual({
        size: 0,
        enabled: false,
      });
    });
  });

  describe('load', () => {
    it('should load a single value', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        return keys.map((key) => `value-${key}`);
      });

      const result = await loader.load('key1');
      expect(result).toBe('value-key1');
    });

    it('should throw TypeError for null key', async () => {
      const loader = new DataLoader(async (keys) => keys);

      await expect(loader.load(null as any)).rejects.toThrow(TypeError);
    });

    it('should throw TypeError for undefined key', async () => {
      const loader = new DataLoader(async (keys) => keys);

      await expect(loader.load(undefined as any)).rejects.toThrow(TypeError);
    });

    it('should batch multiple load calls in same tick', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn);

      // Load 3 keys in parallel (same event loop tick)
      const [r1, r2, r3] = await Promise.all([
        loader.load('key1'),
        loader.load('key2'),
        loader.load('key3'),
      ]);

      expect(r1).toBe('value-key1');
      expect(r2).toBe('value-key2');
      expect(r3).toBe('value-key3');

      // Should only call batch function once
      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(batchFn).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should batch calls across multiple ticks separately', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn);

      // First batch
      const r1 = await loader.load('key1');
      expect(r1).toBe('value-key1');

      // Second batch (different tick)
      const r2 = await loader.load('key2');
      expect(r2).toBe('value-key2');

      // Should call batch function twice
      expect(batchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadMany', () => {
    it('should load multiple values', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        return keys.map((key) => `value-${key}`);
      });

      const results = await loader.loadMany(['key1', 'key2', 'key3']);

      expect(results).toEqual(['value-key1', 'value-key2', 'value-key3']);
    });

    it('should throw TypeError if keys is not an array', async () => {
      const loader = new DataLoader(async (keys) => keys);

      await expect(loader.loadMany('not-array' as any)).rejects.toThrow(TypeError);
    });

    it('should handle empty array', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        return keys.map((key) => `value-${key}`);
      });

      const results = await loader.loadMany([]);
      expect(results).toEqual([]);
    });

    it('should return errors for failed keys', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        return keys.map((key) => {
          if (key === 'error-key') {
            return new Error('Key failed');
          }
          return `value-${key}`;
        });
      });

      const results = await loader.loadMany(['key1', 'error-key', 'key2']);

      expect(results[0]).toBe('value-key1');
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toBe('value-key2');
    });
  });

  describe('caching', () => {
    it('should cache loaded values by default', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn);

      // Load key1 twice
      const r1 = await loader.load('key1');
      const r2 = await loader.load('key1');

      expect(r1).toBe('value-key1');
      expect(r2).toBe('value-key1');

      // Should only call batch function once (cached)
      expect(batchFn).toHaveBeenCalledTimes(1);
    });

    it('should not cache when cache option is false', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn, { cache: false });

      // Load key1 twice
      const r1 = await loader.load('key1');
      const r2 = await loader.load('key1');

      expect(r1).toBe('value-key1');
      expect(r2).toBe('value-key1');

      // Should call batch function twice (no caching)
      expect(batchFn).toHaveBeenCalledTimes(2);
    });

    it('should clear specific key from cache', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn);

      // Load key1
      await loader.load('key1');
      expect(batchFn).toHaveBeenCalledTimes(1);

      // Clear key1
      loader.clear('key1');

      // Load key1 again (should call batch function again)
      await loader.load('key1');
      expect(batchFn).toHaveBeenCalledTimes(2);
    });

    it('should clear all keys from cache', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn);

      // Load multiple keys
      await loader.loadMany(['key1', 'key2', 'key3']);
      expect(batchFn).toHaveBeenCalledTimes(1);

      // Clear all cache
      loader.clearAll();

      // Load keys again (should call batch function again)
      await loader.loadMany(['key1', 'key2', 'key3']);
      expect(batchFn).toHaveBeenCalledTimes(2);
    });

    it('should prime cache with known value', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn);

      // Prime cache with key1
      loader.prime('key1', 'primed-value');

      // Load key1 (should use primed value)
      const result = await loader.load('key1');

      expect(result).toBe('primed-value');
      expect(batchFn).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should reject all requests if batch function throws', async () => {
      const loader = new DataLoader<string, string>(async () => {
        throw new Error('Batch function error');
      });

      await expect(loader.load('key1')).rejects.toThrow(DatabaseError);
      await expect(loader.load('key2')).rejects.toThrow(DatabaseError);
    });

    it('should reject individual keys with errors', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        return keys.map((key) => {
          if (key === 'error-key') {
            return new Error('Key failed');
          }
          return `value-${key}`;
        });
      });

      const r1 = loader.load('key1');
      const r2 = loader.load('error-key');

      await expect(r1).resolves.toBe('value-key1');
      await expect(r2).rejects.toThrow('Key failed');
    });

    it('should throw DatabaseError if batch function returns wrong number of results', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        // Return fewer results than keys
        return keys.slice(0, keys.length - 1).map((key) => `value-${key}`);
      });

      await expect(
        Promise.all([loader.load('key1'), loader.load('key2'), loader.load('key3')])
      ).rejects.toThrow(DatabaseError);
    });

    it('should clear cache for failed keys', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => {
          if (key === 'error-key') {
            return new Error('Key failed');
          }
          return `value-${key}`;
        });
      });

      const loader = new DataLoader(batchFn);

      // First load (fails)
      await expect(loader.load('error-key')).rejects.toThrow('Key failed');

      // Second load (should call batch function again, cache was cleared)
      await expect(loader.load('error-key')).rejects.toThrow('Key failed');

      expect(batchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('maxBatchSize', () => {
    it('should split large batches based on maxBatchSize', async () => {
      const batchFn = jest.fn(async (keys: readonly string[]) => {
        return keys.map((key) => `value-${key}`);
      });

      const loader = new DataLoader(batchFn, { maxBatchSize: 2 });

      // Load 5 keys (should split into 3 batches: 2, 2, 1)
      await Promise.all([
        loader.load('key1'),
        loader.load('key2'),
        loader.load('key3'),
        loader.load('key4'),
        loader.load('key5'),
      ]);

      // Wait for all batches to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(batchFn).toHaveBeenCalledTimes(3);
      expect(batchFn.mock.calls[0][0]).toHaveLength(2);
      expect(batchFn.mock.calls[1][0]).toHaveLength(2);
      expect(batchFn.mock.calls[2][0]).toHaveLength(1);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const loader = new DataLoader<string, string>(async (keys) => {
        return keys.map((key) => `value-${key}`);
      });

      // Initially empty
      expect(loader.getCacheStats()).toEqual({
        size: 0,
        enabled: true,
      });

      // Load some values
      await loader.loadMany(['key1', 'key2', 'key3']);

      // Cache should have 3 entries
      expect(loader.getCacheStats()).toEqual({
        size: 3,
        enabled: true,
      });
    });

    it('should show cache disabled when cache option is false', () => {
      const loader = new DataLoader(async (keys) => keys, { cache: false });

      expect(loader.getCacheStats()).toEqual({
        size: 0,
        enabled: false,
      });
    });
  });

  describe('method chaining', () => {
    it('should support method chaining for clear()', () => {
      const loader = new DataLoader(async (keys) => keys);

      const result = loader.clear('key1').clear('key2');
      expect(result).toBe(loader);
    });

    it('should support method chaining for clearAll()', () => {
      const loader = new DataLoader(async (keys) => keys);

      const result = loader.clearAll();
      expect(result).toBe(loader);
    });

    it('should support method chaining for prime()', () => {
      const loader = new DataLoader(async (keys) => keys);

      const result = loader.prime('key1', 'value1').prime('key2', 'value2');
      expect(result).toBe(loader);
    });
  });

  describe('custom cacheKeyFn', () => {
    it('should use custom cache key function', async () => {
      const batchFn = jest.fn(async (keys: readonly { id: string }[]) => {
        return keys.map((key) => ({ id: key.id, value: `value-${key.id}` }));
      });

      const loader = new DataLoader(batchFn, {
        cacheKeyFn: (key) => key.id,
      });

      const obj1 = { id: 'key1' };
      const obj2 = { id: 'key1' }; // Same ID, different object

      const r1 = await loader.load(obj1);
      const r2 = await loader.load(obj2);

      // Should use cache (same ID)
      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(r1).toEqual(r2);
    });
  });
});
