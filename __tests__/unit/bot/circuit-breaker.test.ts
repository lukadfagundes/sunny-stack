/**
 * Unit Tests: Circuit Breaker
 *
 * Tests for bot/utils/circuit-breaker.ts
 */

import { CircuitBreaker, CircuitState } from '@/bot/utils/circuit-breaker';

describe('bot/utils/circuit-breaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', 3, 1000); // 3 failures, 1s timeout
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.isOpen()).toBe(false);
    });

    it('should allow requests when CLOSED', () => {
      expect(circuitBreaker.isOpen()).toBe(false);
    });
  });

  describe('failure tracking', () => {
    it('should track failures', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.isOpen()).toBe(false); // Still under threshold
    });

    it('should open circuit after threshold failures', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.isOpen()).toBe(true); // Threshold reached
    });

    it('should reset failures on success', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.isOpen()).toBe(false); // Failures reset
    });
  });

  describe('open state', () => {
    beforeEach(() => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }
    });

    it('should be open after threshold failures', () => {
      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should return retryAfter time when open', () => {
      const retryAfter = circuitBreaker.getRetryAfter();
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(1000); // Max 1s (timeout)
    });

    it('should transition to HALF_OPEN after timeout', (done) => {
      setTimeout(() => {
        // After timeout, should transition to HALF_OPEN
        const wasOpen = circuitBreaker.isOpen();
        expect(wasOpen).toBe(false); // HALF_OPEN allows one request
        done();
      }, 1100); // Wait for 1s timeout + buffer
    }, 2000);
  });

  describe('half-open state', () => {
    beforeEach(() => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }
    });

    it('should close on successful request in HALF_OPEN', (done) => {
      setTimeout(() => {
        // Should be HALF_OPEN now
        circuitBreaker.recordSuccess();
        expect(circuitBreaker.isOpen()).toBe(false);
        done();
      }, 1100);
    }, 2000);

    it('should re-open on failed request in HALF_OPEN', (done) => {
      setTimeout(() => {
        // Should be HALF_OPEN now
        circuitBreaker.recordFailure();
        expect(circuitBreaker.isOpen()).toBe(true);
        done();
      }, 1100);
    }, 2000);
  });

  describe('custom configuration', () => {
    it('should respect custom threshold', () => {
      const cb = new CircuitBreaker('test', 5, 1000);
      for (let i = 0; i < 4; i++) {
        cb.recordFailure();
      }
      expect(cb.isOpen()).toBe(false);
      cb.recordFailure();
      expect(cb.isOpen()).toBe(true);
    });

    it('should respect custom timeout', () => {
      const cb = new CircuitBreaker('test', 3, 500);
      for (let i = 0; i < 3; i++) {
        cb.recordFailure();
      }
      expect(cb.getRetryAfter()).toBeLessThanOrEqual(500);
    });
  });
});
