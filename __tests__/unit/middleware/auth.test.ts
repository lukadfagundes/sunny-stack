/**
 * @jest-environment node
 */

// __tests__/unit/middleware/auth.test.ts

/**
 * Unit Tests for API Authentication Middleware
 *
 * Tests 4 authentication methods:
 * 1. Google OAuth (NextAuth) - Admin dashboard authentication
 * 2. Bot API Key - Discord bot → Next.js API authentication
 * 3. Webhook Signatures - GitHub/Vercel webhook verification
 * 4. Rate Limiting - Prevent abuse (10 req/min per IP)
 *
 * Follows TDD RED-GREEN-REFACTOR methodology
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock NextAuth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock NextAuth server functions
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock webhook verification functions
jest.mock('@/lib/webhooks/verify', () => ({
  verifyGitHubWebhook: jest.fn(),
  verifyVercelWebhook: jest.fn(),
}));

// Import functions to test (these don't exist yet - RED phase)
import {
  withAuth,
  withBotAuth,
  withWebhookAuth,
  withRateLimit,
  type AuthMiddlewareConfig,
  type BotAuthConfig,
  type WebhookAuthConfig,
  type RateLimitConfig,
} from '@/lib/middleware/auth';

import {
  verifyGitHubWebhook,
  verifyVercelWebhook,
} from '@/lib/webhooks/verify';

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.ADMIN_EMAIL;
    delete process.env.BOT_API_KEY;
    delete process.env.GITHUB_WEBHOOK_SECRET;
    delete process.env.VERCEL_WEBHOOK_SECRET;
  });

  describe('withAuth (NextAuth Google OAuth)', () => {
    test('should allow authenticated admin user', async () => {
      // ARRANGE
      process.env.ADMIN_EMAIL = 'admin@example.com';
      const mockSession = {
        user: {
          email: 'admin@example.com',
          name: 'Admin User',
          image: 'https://example.com/avatar.jpg',
        },
      };

      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(mockSession);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin');
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
      expect(getServerSession).toHaveBeenCalled();
    });

    test('should reject unauthenticated user with 401', async () => {
      // ARRANGE
      process.env.ADMIN_EMAIL = 'admin@example.com';
      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(null); // No session

      const mockRequest = new NextRequest('http://localhost:3000/api/admin');
      const mockHandler = jest.fn();

      // ACT
      const result = await withAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toBe('Unauthorized - No session found');
    });

    test('should reject non-admin user with 403', async () => {
      // ARRANGE
      process.env.ADMIN_EMAIL = 'admin@example.com';
      const mockSession = {
        user: {
          email: 'user@example.com', // Not admin
          name: 'Regular User',
        },
      };

      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(mockSession);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin');
      const mockHandler = jest.fn();

      // ACT
      const result = await withAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error).toBe('Forbidden - Admin access required');
    });

    test('should throw error when ADMIN_EMAIL is not configured', async () => {
      // ARRANGE
      // No ADMIN_EMAIL set
      const mockRequest = new NextRequest('http://localhost:3000/api/admin');
      const mockHandler = jest.fn();

      // ACT & ASSERT
      await expect(withAuth(mockHandler)(mockRequest)).rejects.toThrow(
        'ADMIN_EMAIL environment variable is not defined'
      );
    });

    test('should accept custom admin email list', async () => {
      // ARRANGE
      const config: AuthMiddlewareConfig = {
        adminEmails: ['admin1@example.com', 'admin2@example.com'],
      };

      const mockSession = {
        user: {
          email: 'admin2@example.com',
          name: 'Admin 2',
        },
      };

      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(mockSession);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin');
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });

    test('should handle session callback errors gracefully', async () => {
      // ARRANGE
      process.env.ADMIN_EMAIL = 'admin@example.com';
      const { getServerSession } = require('next-auth/next');
      getServerSession.mockRejectedValue(new Error('Session retrieval failed'));

      const mockRequest = new NextRequest('http://localhost:3000/api/admin');
      const mockHandler = jest.fn();

      // ACT
      const result = await withAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toContain('Authentication failed');
    });
  });

  describe('withBotAuth (Bot API Key)', () => {
    test('should allow request with valid Bot API key', async () => {
      // ARRANGE
      process.env.BOT_API_KEY = 'test-bot-key-12345';

      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync', {
        headers: {
          'x-api-key': 'test-bot-key-12345',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withBotAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });

    test('should reject request with missing API key header', async () => {
      // ARRANGE
      process.env.BOT_API_KEY = 'test-bot-key-12345';

      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync');
      const mockHandler = jest.fn();

      // ACT
      const result = await withBotAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toBe('Unauthorized - Missing API key');
    });

    test('should reject request with invalid API key', async () => {
      // ARRANGE
      process.env.BOT_API_KEY = 'test-bot-key-12345';

      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync', {
        headers: {
          'x-api-key': 'wrong-key',
        },
      });

      const mockHandler = jest.fn();

      // ACT
      const result = await withBotAuth(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error).toBe('Forbidden - Invalid API key');
    });

    test('should throw error when BOT_API_KEY is not configured', async () => {
      // ARRANGE
      // No BOT_API_KEY set
      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync', {
        headers: {
          'x-api-key': 'some-key',
        },
      });
      const mockHandler = jest.fn();

      // ACT & ASSERT
      await expect(withBotAuth(mockHandler)(mockRequest)).rejects.toThrow(
        'BOT_API_KEY environment variable is not defined'
      );
    });

    test('should accept custom API key header name', async () => {
      // ARRANGE
      process.env.BOT_API_KEY = 'test-bot-key-12345';
      const config: BotAuthConfig = {
        headerName: 'authorization',
        prefix: 'Bearer ',
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync', {
        headers: {
          authorization: 'Bearer test-bot-key-12345',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withBotAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });

    test('should support multiple valid API keys', async () => {
      // ARRANGE
      const config: BotAuthConfig = {
        apiKeys: ['key-1', 'key-2', 'key-3'],
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync', {
        headers: {
          'x-api-key': 'key-2',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withBotAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });
  });

  describe('withWebhookAuth (Webhook Signatures)', () => {
    test('should verify valid GitHub webhook signature', async () => {
      // ARRANGE
      process.env.GITHUB_WEBHOOK_SECRET = 'github-secret-12345';

      const payload = JSON.stringify({
        action: 'opened',
        pull_request: { id: 1 },
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=valid-signature',
          'content-type': 'application/json',
        },
        body: payload,
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // Mock verifyGitHubWebhook to return true
      (verifyGitHubWebhook as jest.Mock).mockReturnValue(true);

      // ACT
      const config: WebhookAuthConfig = { provider: 'github' };
      const result = await withWebhookAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });

    test('should reject GitHub webhook with invalid signature', async () => {
      // ARRANGE
      process.env.GITHUB_WEBHOOK_SECRET = 'github-secret-12345';

      const payload = JSON.stringify({
        action: 'opened',
        pull_request: { id: 1 },
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=invalid-signature',
          'content-type': 'application/json',
        },
        body: payload,
      });

      const mockHandler = jest.fn();

      // Mock verifyGitHubWebhook to return false
      (verifyGitHubWebhook as jest.Mock).mockReturnValue(false);

      // ACT
      const config: WebhookAuthConfig = { provider: 'github' };
      const result = await withWebhookAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error).toBe('Forbidden - Invalid webhook signature');
    });

    test('should reject GitHub webhook with missing signature', async () => {
      // ARRANGE
      process.env.GITHUB_WEBHOOK_SECRET = 'github-secret-12345';

      const mockRequest = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'opened' }),
      });

      const mockHandler = jest.fn();

      // ACT
      const config: WebhookAuthConfig = { provider: 'github' };
      const result = await withWebhookAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toBe('Unauthorized - Missing webhook signature');
    });

    test('should verify valid Vercel webhook signature', async () => {
      // ARRANGE
      process.env.VERCEL_WEBHOOK_SECRET = 'vercel-secret-12345';

      const payload = JSON.stringify({
        type: 'deployment',
        payload: { state: 'READY' },
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/webhooks/vercel', {
        method: 'POST',
        headers: {
          'x-vercel-signature': 'valid-signature',
          'content-type': 'application/json',
        },
        body: payload,
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // Mock verifyVercelWebhook to return true
      (verifyVercelWebhook as jest.Mock).mockReturnValue(true);

      // ACT
      const config: WebhookAuthConfig = { provider: 'vercel' };
      const result = await withWebhookAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });

    test('should throw error when webhook secret is not configured', async () => {
      // ARRANGE
      // No GITHUB_WEBHOOK_SECRET set

      const mockRequest = new NextRequest('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=signature',
        },
      });

      const mockHandler = jest.fn();

      // ACT & ASSERT
      const config: WebhookAuthConfig = { provider: 'github' };
      await expect(withWebhookAuth(mockHandler, config)(mockRequest)).rejects.toThrow(
        'GITHUB_WEBHOOK_SECRET environment variable is not defined'
      );
    });

    test('should support custom webhook providers', async () => {
      // ARRANGE
      const config: WebhookAuthConfig = {
        provider: 'custom',
        secret: 'custom-secret',
        headerName: 'x-custom-signature',
        verifyFn: (payload: string, signature: string, secret: string) => {
          return signature === `custom-${secret}`;
        },
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/webhooks/custom', {
        method: 'POST',
        headers: {
          'x-custom-signature': 'custom-custom-secret',
        },
        body: JSON.stringify({ data: 'test' }),
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withWebhookAuth(mockHandler, config)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });
  });

  describe('withRateLimit (Rate Limiting)', () => {
    test('should allow requests within rate limit (10 req/min)', async () => {
      // ARRANGE
      const mockRequest = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withRateLimit(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
      expect(result.headers.get('x-ratelimit-limit')).toBe('10');
      expect(result.headers.get('x-ratelimit-remaining')).toBe('9');
    });

    test('should reject requests exceeding rate limit with 429', async () => {
      // ARRANGE
      const mockRequest = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.2',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const middleware = withRateLimit(mockHandler);

      // ACT - Make 11 requests (1 over the limit)
      const results = [];
      for (let i = 0; i < 11; i++) {
        results.push(await middleware(mockRequest));
      }

      // ASSERT
      const lastResult = results[10];
      expect(lastResult.status).toBe(429);
      const body = await lastResult.json();
      expect(body.error).toBe('Too Many Requests - Rate limit exceeded');
      expect(lastResult.headers.get('x-ratelimit-limit')).toBe('10');
      expect(lastResult.headers.get('x-ratelimit-remaining')).toBe('0');
      expect(lastResult.headers.get('retry-after')).toBeDefined();
    });

    test('should track rate limit per IP address', async () => {
      // ARRANGE
      const mockRequest1 = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.3',
        },
      });

      const mockRequest2 = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.4',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const middleware = withRateLimit(mockHandler);

      // ACT - Make 10 requests from IP1, then 1 from IP2
      for (let i = 0; i < 10; i++) {
        await middleware(mockRequest1);
      }
      const result = await middleware(mockRequest2);

      // ASSERT - IP2 should still be allowed
      expect(mockHandler).toHaveBeenCalledWith(mockRequest2);
      expect(result.status).not.toBe(429);
      expect(result.headers.get('x-ratelimit-remaining')).toBe('9');
    });

    test('should reset rate limit after time window expires', async () => {
      // ARRANGE
      jest.useFakeTimers();
      const mockRequest = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.5',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const middleware = withRateLimit(mockHandler);

      // ACT - Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        await middleware(mockRequest);
      }

      // Advance time by 61 seconds (past 1 minute window)
      jest.advanceTimersByTime(61000);

      // Make another request (should succeed after reset)
      const result = await middleware(mockRequest);

      // ASSERT
      expect(result.status).not.toBe(429);
      expect(result.headers.get('x-ratelimit-remaining')).toBe('9');

      jest.useRealTimers();
    });

    test('should support custom rate limit configuration', async () => {
      // ARRANGE
      const config: RateLimitConfig = {
        limit: 5,
        windowMs: 60000, // 1 minute
      };

      const mockRequest = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.6',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const middleware = withRateLimit(mockHandler, config);

      // ACT - Make 6 requests (1 over custom limit of 5)
      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(await middleware(mockRequest));
      }

      // ASSERT
      const lastResult = results[5];
      expect(lastResult.status).toBe(429);
      expect(lastResult.headers.get('x-ratelimit-limit')).toBe('5');
    });

    test('should extract IP from x-real-ip header if x-forwarded-for is missing', async () => {
      // ARRANGE
      const mockRequest = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-real-ip': '192.168.1.7',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withRateLimit(mockHandler)(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result.headers.get('x-ratelimit-remaining')).toBe('9');
    });

    test('should handle missing IP headers gracefully', async () => {
      // ARRANGE
      const mockRequest = new NextRequest('http://localhost:3000/api/data');
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const result = await withRateLimit(mockHandler)(mockRequest);

      // ASSERT
      // Should use a fallback IP (e.g., 'unknown')
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBeDefined();
    });

    test('should cleanup old rate limit entries automatically', async () => {
      // ARRANGE
      jest.useFakeTimers();
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const middleware = withRateLimit(mockHandler);

      // ACT - Create entries for 100 different IPs
      for (let i = 0; i < 100; i++) {
        const mockRequest = new NextRequest('http://localhost:3000/api/data', {
          headers: {
            'x-forwarded-for': `192.168.1.${i}`,
          },
        });
        await middleware(mockRequest);
      }

      // Advance time by 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Make a new request (should trigger cleanup)
      const newRequest = new NextRequest('http://localhost:3000/api/data', {
        headers: {
          'x-forwarded-for': '192.168.1.200',
        },
      });
      await middleware(newRequest);

      // ASSERT - Old entries should be cleaned up (verify in implementation)
      expect(mockHandler).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Middleware Composition', () => {
    test('should compose withAuth and withRateLimit', async () => {
      // ARRANGE
      process.env.ADMIN_EMAIL = 'admin@example.com';
      const mockSession = {
        user: {
          email: 'admin@example.com',
          name: 'Admin',
        },
      };

      const { getServerSession } = require('next-auth/next');
      getServerSession.mockResolvedValue(mockSession);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT - Apply both middleware
      const composedHandler = withRateLimit(withAuth(mockHandler));
      const result = await composedHandler(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result.headers.get('x-ratelimit-limit')).toBeDefined();
    });

    test('should compose withBotAuth and withRateLimit', async () => {
      // ARRANGE
      process.env.BOT_API_KEY = 'test-bot-key';

      const mockRequest = new NextRequest('http://localhost:3000/api/bot/sync', {
        headers: {
          'x-api-key': 'test-bot-key',
          'x-forwarded-for': '192.168.1.101',
        },
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      // ACT
      const composedHandler = withRateLimit(withBotAuth(mockHandler));
      const result = await composedHandler(mockRequest);

      // ASSERT
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result.headers.get('x-ratelimit-limit')).toBeDefined();
    });
  });

  describe('TypeScript Type Safety', () => {
    test('should enforce AuthMiddlewareConfig type', () => {
      // ARRANGE
      const config: AuthMiddlewareConfig = {
        adminEmails: ['admin@example.com'],
      };

      // ASSERT - TypeScript compilation will enforce this
      expect(config.adminEmails).toHaveLength(1);
    });

    test('should enforce BotAuthConfig type', () => {
      // ARRANGE
      const config: BotAuthConfig = {
        headerName: 'x-api-key',
        apiKeys: ['key1', 'key2'],
      };

      // ASSERT - TypeScript compilation will enforce this
      expect(config.headerName).toBe('x-api-key');
      expect(config.apiKeys).toHaveLength(2);
    });

    test('should enforce WebhookAuthConfig type', () => {
      // ARRANGE
      const config: WebhookAuthConfig = {
        provider: 'github',
      };

      // ASSERT - TypeScript compilation will enforce this
      expect(config.provider).toBe('github');
    });

    test('should enforce RateLimitConfig type', () => {
      // ARRANGE
      const config: RateLimitConfig = {
        limit: 10,
        windowMs: 60000,
      };

      // ASSERT - TypeScript compilation will enforce this
      expect(config.limit).toBe(10);
      expect(config.windowMs).toBe(60000);
    });
  });
});
