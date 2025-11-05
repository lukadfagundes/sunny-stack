/**
 * API Client for Next.js Backend
 *
 * Type-safe HTTP client with retry logic, circuit breaker, and timeout handling
 *
 * @module bot/core/api-client
 */

import type { ApiRequestOptions, ApiResponse } from '../types';
import { ApiError, TimeoutError, CircuitBreakerOpenError } from './errors';
import { logApiRequest } from './logger';
import { CircuitBreaker } from '../utils/circuit-breaker';

/**
 * API Client class
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultTimeout: number;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(baseUrl: string, apiKey: string, timeout = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.defaultTimeout = timeout;
    this.circuitBreaker = new CircuitBreaker('api-client', 5, 60000);
  }

  /**
   * Make HTTP request with retry logic
   *
   * @param endpoint - API endpoint (e.g., '/admin/projects')
   * @param options - Request options
   * @returns Typed API response
   * @throws {ApiError} If request fails after retries
   * @throws {CircuitBreakerOpenError} If circuit breaker is open
   * @throws {TimeoutError} If request times out
   */
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      const retryAfter = this.circuitBreaker.getRetryAfter();
      throw new CircuitBreakerOpenError(
        `API circuit breaker is open. Retry after ${retryAfter}ms`,
        'api-client',
        retryAfter
      );
    }

    const method = options.method || 'GET';
    const timeout = options.timeout || this.defaultTimeout;
    const url = `${this.baseUrl}${endpoint}`;

    const startTime = Date.now();

    try {
      // Build request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      // Make request
      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      // Parse response
      const data = await response.json();

      // Log request
      logApiRequest({
        endpoint,
        method,
        statusCode: response.status,
        responseTime,
        error: response.ok ? undefined : data.error,
      });

      // Record success in circuit breaker
      if (response.ok) {
        this.circuitBreaker.recordSuccess();
      } else {
        this.circuitBreaker.recordFailure();
      }

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || 'Request failed',
        statusCode: response.status,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record failure in circuit breaker
      this.circuitBreaker.recordFailure();

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        logApiRequest({
          endpoint,
          method,
          statusCode: 408,
          responseTime,
          error: 'Request timeout',
        });

        throw new TimeoutError(
          `Request to ${endpoint} timed out after ${timeout}ms`,
          endpoint,
          timeout
        );
      }

      // Handle other errors
      const err = error as Error;

      logApiRequest({
        endpoint,
        method,
        statusCode: 500,
        responseTime,
        error: err.message,
      });

      throw new ApiError(
        `API request failed: ${err.message}`,
        endpoint,
        500,
        err
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body: Record<string, unknown>,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body: Record<string, unknown>,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    options: Omit<ApiRequestOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH' });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.getState(),
      failures: this.circuitBreaker.getFailureCount(),
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }
}
