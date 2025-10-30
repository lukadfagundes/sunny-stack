/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by opening circuit after consecutive failures
 *
 * @module bot/utils/circuit-breaker
 */

import { botLogger } from '../core/logger';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit tripped, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private openedAt: number | null = null;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly name: string;

  /**
   * Create circuit breaker
   *
   * @param name - Circuit breaker name (for logging)
   * @param threshold - Number of failures before opening (default: 5)
   * @param timeout - Time to wait before retry in ms (default: 60000)
   */
  constructor(name: string, threshold = 5, timeout = 60000) {
    this.name = name;
    this.threshold = threshold;
    this.timeout = timeout;
  }

  /**
   * Check if circuit breaker is open
   *
   * @returns True if circuit is open
   */
  isOpen(): boolean {
    if (this.state === CircuitState.OPEN && this.openedAt) {
      // Check if timeout has passed
      const now = Date.now();
      if (now - this.openedAt >= this.timeout) {
        // Move to half-open state
        this.state = CircuitState.HALF_OPEN;
        botLogger.info('Circuit breaker entering half-open state', {
          name: this.name,
        });
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      // Success in half-open state closes the circuit
      this.reset();
      botLogger.info('Circuit breaker closed after successful request', {
        name: this.name,
      });
    }

    // Reset failure count on success
    if (this.failures > 0) {
      this.failures = 0;
    }
  }

  /**
   * Record failed request
   */
  recordFailure(): void {
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Failure in half-open state reopens the circuit
      this.open();
      botLogger.warn('Circuit breaker reopened after failed test', {
        name: this.name,
      });
      return;
    }

    if (this.failures >= this.threshold) {
      this.open();
      botLogger.error('Circuit breaker opened after threshold reached', {
        name: this.name,
        failures: this.failures,
        threshold: this.threshold,
      });
    }
  }

  /**
   * Open the circuit
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.openedAt = Date.now();
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.openedAt = null;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failures;
  }

  /**
   * Get time until retry (in ms)
   */
  getRetryAfter(): number {
    if (this.state !== CircuitState.OPEN || !this.openedAt) {
      return 0;
    }

    const elapsed = Date.now() - this.openedAt;
    return Math.max(0, this.timeout - elapsed);
  }
}
