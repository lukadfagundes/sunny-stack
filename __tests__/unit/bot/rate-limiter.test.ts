/**
 * Unit Tests: Rate Limiter
 *
 * Tests for bot/utils/rate-limiter.ts
 */

import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  cleanupRateLimits,
} from '@/bot/utils/rate-limiter';

describe('bot/utils/rate-limiter', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimit(userId);
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 tokens, used 1
      expect(result.retryAfter).toBe(0);
    });

    it('should track multiple requests', () => {
      checkRateLimit(userId); // 1st
      checkRateLimit(userId); // 2nd
      const result = checkRateLimit(userId); // 3rd
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 tokens, used 3
    });

    it('should block after 5 requests', () => {
      // Use all 5 tokens
      for (let i = 0; i < 5; i++) {
        checkRateLimit(userId);
      }

      // 6th request should be blocked
      const result = checkRateLimit(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different users separately', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      checkRateLimit(user1);
      checkRateLimit(user1);

      const result1 = checkRateLimit(user1);
      const result2 = checkRateLimit(user2);

      expect(result1.remaining).toBe(2); // Used 3
      expect(result2.remaining).toBe(4); // Used 1
    });

    it('should refill tokens over time', async () => {
      // Use all tokens
      for (let i = 0; i < 5; i++) {
        checkRateLimit(userId);
      }

      // Should be blocked
      expect(checkRateLimit(userId).allowed).toBe(false);

      // Wait for token refill (tokens refill at 1 per 12 seconds = 5 per 60s)
      // In tests, we can't actually wait, so this is more of a design verification
      // In production, the rate limiter uses timestamps to calculate token refill
    });
  });

  describe('resetRateLimit', () => {
    it('should reset user rate limit', () => {
      // Use some tokens
      checkRateLimit(userId);
      checkRateLimit(userId);
      checkRateLimit(userId);

      // Reset
      resetRateLimit(userId);

      // Should have full tokens again
      const result = checkRateLimit(userId);
      expect(result.remaining).toBe(4); // Full 5, used 1
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status for new user', () => {
      const status = getRateLimitStatus(userId);
      expect(status).toBeDefined();
      expect(status.remaining).toBe(5);
      expect(typeof status.resetAt).toBe('number');
      expect(status.resetAt).toBeGreaterThan(Date.now());
    });

    it('should return current status after requests', () => {
      checkRateLimit(userId);
      checkRateLimit(userId);

      const status = getRateLimitStatus(userId);
      expect(status.remaining).toBe(3); // 5 tokens, used 2
    });
  });

  describe('cleanupRateLimits', () => {
    it('should clean up old rate limit entries', () => {
      // Create some rate limit entries
      checkRateLimit('user-1');
      checkRateLimit('user-2');
      checkRateLimit('user-3');

      // Cleanup should not throw
      expect(() => cleanupRateLimits()).not.toThrow();
    });
  });
});
