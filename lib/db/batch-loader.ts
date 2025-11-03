/**
 * @file DataLoader - Batching and caching utility for database queries
 * @description Implements Facebook's DataLoader pattern to prevent N+1 query problems
 * @module lib/db/batch-loader
 *
 * @see https://github.com/graphql/dataloader
 *
 * Usage Example:
 * ```typescript
 * const projectLoader = new DataLoader(async (projectIds) => {
 *   const projects = await prisma.project.findMany({
 *     where: { id: { in: projectIds } }
 *   });
 *   return projectIds.map(id => projects.find(p => p.id === id) || null);
 * });
 *
 * // These 3 calls will be batched into a single database query
 * const [p1, p2, p3] = await Promise.all([
 *   projectLoader.load('id1'),
 *   projectLoader.load('id2'),
 *   projectLoader.load('id3'),
 * ]);
 * ```
 */

import { logger } from '@/lib/logger';
import { DatabaseError } from '@/lib/errors/app-error';

/**
 * Configuration options for DataLoader
 */
export interface DataLoaderOptions<K, V> {
  /**
   * Enable caching of loaded values (default: true)
   * Cached values persist for the lifetime of the DataLoader instance
   */
  cache?: boolean;

  /**
   * Maximum number of keys to batch in a single request (default: Infinity)
   * Useful for preventing queries with too many IN clause values
   */
  maxBatchSize?: number;

  /**
   * Custom cache implementation (default: Map)
   * Must implement Map interface (get, set, delete, clear)
   */
  cacheMap?: Map<K, Promise<V>>;

  /**
   * Custom cache key function (default: key => key)
   * Useful for complex key types
   */
  cacheKeyFn?: (key: K) => unknown;

  /**
   * Name for debugging and logging purposes
   */
  name?: string;
}

/**
 * Queued load request
 */
interface QueuedRequest<K, V> {
  key: K;
  resolve: (value: V) => void;
  reject: (error: Error) => void;
}

/**
 * DataLoader - Batching and caching utility for database queries
 *
 * Prevents N+1 query problems by batching multiple load requests
 * into a single database query executed within the same event loop tick.
 *
 * @template K - Key type (e.g., string, number)
 * @template V - Value type (e.g., Project, Quote, User)
 *
 * @example
 * // Create a loader for projects
 * const projectLoader = new DataLoader(async (ids) => {
 *   const projects = await prisma.project.findMany({
 *     where: { id: { in: ids } }
 *   });
 *   // IMPORTANT: Return results in same order as input keys
 *   return ids.map(id => projects.find(p => p.id === id) || null);
 * });
 *
 * // Load individual projects (will be batched)
 * const project1 = await projectLoader.load('project-id-1');
 * const project2 = await projectLoader.load('project-id-2');
 *
 * // Load multiple projects
 * const projects = await projectLoader.loadMany(['id1', 'id2', 'id3']);
 */
export class DataLoader<K, V> {
  private batchFn: (keys: readonly K[]) => Promise<ArrayLike<V | Error>>;
  private options: Required<
    Omit<DataLoaderOptions<K, V>, 'cacheMap' | 'cacheKeyFn'>
  >;
  private cacheMap: Map<K, Promise<V>> | null;
  private cacheKeyFn: (key: K) => unknown;
  private queue: Array<QueuedRequest<K, V>>;
  private batchScheduled: boolean;
  private name: string;

  /**
   * Creates a new DataLoader instance
   *
   * @param batchFn - Function that loads values for an array of keys
   *                  MUST return values in the same order as keys
   *                  Can return Error for individual failures
   * @param options - Configuration options
   *
   * @example
   * const userLoader = new DataLoader(
   *   async (userIds) => {
   *     const users = await db.users.findMany({ where: { id: { in: userIds } } });
   *     return userIds.map(id => users.find(u => u.id === id) || new NotFoundError('User', id));
   *   },
   *   { name: 'UserLoader', maxBatchSize: 100 }
   * );
   */
  constructor(
    batchFn: (keys: readonly K[]) => Promise<ArrayLike<V | Error>>,
    options: DataLoaderOptions<K, V> = {}
  ) {
    // Validate batch function
    if (typeof batchFn !== 'function') {
      throw new TypeError('DataLoader must be constructed with a batch loading function');
    }

    this.batchFn = batchFn;
    this.options = {
      cache: options.cache !== false,
      maxBatchSize: options.maxBatchSize ?? Infinity,
      name: options.name ?? 'DataLoader',
    };

    this.cacheMap = this.options.cache
      ? options.cacheMap ?? new Map<K, Promise<V>>()
      : null;

    this.cacheKeyFn = options.cacheKeyFn ?? ((key: K) => key);
    this.queue = [];
    this.batchScheduled = false;
    this.name = this.options.name;
  }

  /**
   * Load a single value by key
   *
   * Multiple calls to load() within the same event loop tick
   * are batched into a single call to the batch function.
   *
   * @param key - Key to load
   * @returns Promise resolving to the loaded value
   *
   * @example
   * const project = await projectLoader.load('project-123');
   */
  async load(key: K): Promise<V> {
    if (key === null || key === undefined) {
      throw new TypeError(
        `${this.name}: key parameter must not be null or undefined`
      );
    }

    // Check cache first
    const cacheKey = this.cacheKeyFn(key);
    if (this.cacheMap) {
      const cachedPromise = this.cacheMap.get(cacheKey as K);
      if (cachedPromise) {
        logger.debug(`${this.name}: Cache hit for key`, { key: String(key) });
        return cachedPromise;
      }
    }

    // Create promise for this load request
    const promise = new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
    });

    // Cache the promise immediately
    if (this.cacheMap) {
      this.cacheMap.set(cacheKey as K, promise);
    }

    // Schedule batch execution if not already scheduled
    if (!this.batchScheduled) {
      this.batchScheduled = true;
      // Use process.nextTick to batch all requests in current event loop tick
      process.nextTick(() => {
        this.dispatchQueue();
      });
    }

    return promise;
  }

  /**
   * Load multiple values by keys
   *
   * More efficient than calling load() multiple times as it
   * allows the batch function to optimize the query.
   *
   * @param keys - Array of keys to load
   * @returns Promise resolving to array of loaded values (same order as keys)
   *
   * @example
   * const projects = await projectLoader.loadMany(['id1', 'id2', 'id3']);
   */
  async loadMany(keys: readonly K[]): Promise<Array<V | Error>> {
    if (!Array.isArray(keys)) {
      throw new TypeError(`${this.name}: keys parameter must be an array`);
    }

    try {
      return await Promise.all(
        keys.map((key) =>
          this.load(key).catch((error) => error)
        )
      );
    } catch (error) {
      logger.error(`${this.name}: loadMany failed`, {
        error: error instanceof Error ? error.message : String(error),
        keysCount: keys.length,
      });
      throw error;
    }
  }

  /**
   * Clear a single key from the cache
   *
   * @param key - Key to clear from cache
   * @returns this (for chaining)
   *
   * @example
   * projectLoader.clear('project-123');
   */
  clear(key: K): this {
    const cacheKey = this.cacheKeyFn(key);
    if (this.cacheMap) {
      this.cacheMap.delete(cacheKey as K);
      logger.debug(`${this.name}: Cache cleared for key`, { key: String(key) });
    }
    return this;
  }

  /**
   * Clear all keys from the cache
   *
   * @returns this (for chaining)
   *
   * @example
   * projectLoader.clearAll();
   */
  clearAll(): this {
    if (this.cacheMap) {
      const size = this.cacheMap.size;
      this.cacheMap.clear();
      logger.debug(`${this.name}: All cache cleared`, { entriesCleared: size });
    }
    return this;
  }

  /**
   * Prime the cache with a known value
   *
   * Useful for pre-populating the cache with values that
   * were loaded through other means.
   *
   * @param key - Key to prime
   * @param value - Value to cache
   * @returns this (for chaining)
   *
   * @example
   * // After creating a project, prime the cache
   * const newProject = await prisma.project.create({ data: {...} });
   * projectLoader.prime(newProject.id, newProject);
   */
  prime(key: K, value: V): this {
    const cacheKey = this.cacheKeyFn(key);
    if (this.cacheMap) {
      this.cacheMap.set(cacheKey as K, Promise.resolve(value));
      logger.debug(`${this.name}: Cache primed for key`, { key: String(key) });
    }
    return this;
  }

  /**
   * Execute the batched queries
   * Called via process.nextTick after load() calls
   */
  private async dispatchQueue(): Promise<void> {
    this.batchScheduled = false;

    // Get current queue and reset
    const queue = this.queue;
    this.queue = [];

    if (queue.length === 0) {
      return;
    }

    // Handle max batch size
    if (queue.length > this.options.maxBatchSize) {
      // Split into multiple batches
      for (let i = 0; i < queue.length; i += this.options.maxBatchSize) {
        const batch = queue.slice(i, i + this.options.maxBatchSize);
        this.queue.push(...batch);
      }
      // Re-schedule dispatch for remaining batches
      this.batchScheduled = true;
      process.nextTick(() => {
        this.dispatchQueue();
      });
      // Process first batch
      this.queue = queue.slice(this.options.maxBatchSize);
      queue.length = this.options.maxBatchSize;
    }

    const keys = queue.map((q) => q.key);
    const startTime = Date.now();

    logger.debug(`${this.name}: Dispatching batch`, {
      batchSize: keys.length,
      maxBatchSize: this.options.maxBatchSize,
    });

    try {
      // Execute batch function
      const values = await this.batchFn(keys);

      const duration = Date.now() - startTime;
      logger.debug(`${this.name}: Batch completed`, {
        batchSize: keys.length,
        duration,
      });

      // Validate batch function returned correct number of results
      if (values.length !== keys.length) {
        throw new DatabaseError(
          `${this.name}: Batch function must return array of same length as keys. ` +
            `Expected ${keys.length}, got ${values.length}`
        );
      }

      // Resolve each queued request with its corresponding value
      queue.forEach((request, index) => {
        const value = values[index];

        if (value instanceof Error) {
          // Individual key failed
          request.reject(value);
          // Clear cache for failed key
          this.clear(request.key);
        } else {
          request.resolve(value);
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${this.name}: Batch failed`, {
        error: error instanceof Error ? error.message : String(error),
        batchSize: keys.length,
        duration,
      });

      // Reject all queued requests with the same error
      const batchError =
        error instanceof DatabaseError
          ? error
          : new DatabaseError(
              `${this.name}: Batch loading failed`,
              error instanceof Error ? error : undefined
            );

      queue.forEach((request) => {
        request.reject(batchError);
        // Clear cache for failed key
        this.clear(request.key);
      });
    }
  }

  /**
   * Get cache statistics
   * Useful for monitoring and debugging
   */
  getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.cacheMap?.size ?? 0,
      enabled: this.options.cache,
    };
  }
}

/**
 * Export DataLoader as default
 */
export default DataLoader;
