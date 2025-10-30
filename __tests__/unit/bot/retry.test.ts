/**
 * Unit Tests: Retry Logic
 *
 * Tests for bot/utils/retry.ts
 */

import { withRetry, withRetryIf, withNetworkRetry } from '@/bot/utils/retry';

describe('bot/utils/retry', () => {
  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await withRetry(operation);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, { maxAttempts: 3, initialDelayMs: 10 });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(
        withRetry(operation, { maxAttempts: 3, initialDelayMs: 10 })
      ).rejects.toThrow('persistent failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(operation, {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
        jitter: false, // Disable jitter for predictable timing
      });
      const duration = Date.now() - startTime;

      // First retry: 100ms, Second retry: 200ms = 300ms total minimum
      expect(duration).toBeGreaterThanOrEqual(300);
    });

    it('should respect max delay', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(operation, {
        maxAttempts: 2,
        initialDelayMs: 1000,
        maxDelayMs: 50, // Cap delay at 50ms
        jitter: false,
      });
      const duration = Date.now() - startTime;

      // Should use maxDelayMs instead of 1000ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe('withRetryIf', () => {
    it('should only retry for specific errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('NETWORK_ERROR'))
        .mockResolvedValue('success');

      const shouldRetry = (error: Error) => error.message.includes('NETWORK');

      const result = await withRetryIf(operation, shouldRetry, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry for non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('FATAL_ERROR'));

      const shouldRetry = (error: Error) => error.message.includes('NETWORK');

      await expect(
        withRetryIf(operation, shouldRetry, { maxAttempts: 3, initialDelayMs: 10 })
      ).rejects.toThrow('FATAL_ERROR');
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('withNetworkRetry', () => {
    it('should retry network errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');

      const result = await withNetworkRetry(operation, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry timeout errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success');

      const result = await withNetworkRetry(operation, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });
      expect(result).toBe('success');
    });

    it('should not retry non-network errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('VALIDATION_ERROR'));

      await expect(
        withNetworkRetry(operation, { maxAttempts: 3, initialDelayMs: 10 })
      ).rejects.toThrow('VALIDATION_ERROR');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('jitter', () => {
    it('should add randomness when jitter enabled', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await withRetry(
          jest
            .fn()
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValue('success'),
          {
            maxAttempts: 2,
            initialDelayMs: 100,
            jitter: true,
          }
        );
        delays.push(Date.now() - startTime);
      }

      // With jitter, delays should vary
      const uniqueDelays = new Set(delays.map((d) => Math.floor(d / 10)));
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });
});
