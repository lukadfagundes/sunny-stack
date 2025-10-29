/**
 * API Authentication Middleware
 *
 * Provides 4 authentication methods for Next.js API routes:
 * 1. Google OAuth (NextAuth) - Admin dashboard authentication
 * 2. Bot API Key - Discord bot → Next.js API authentication
 * 3. Webhook Signatures - GitHub/Vercel webhook verification
 * 4. Rate Limiting - Prevent abuse (10 req/min per IP)
 *
 * Usage:
 * ```typescript
 * // Protect admin route with NextAuth
 * export const GET = withAuth(async (req) => { ... });
 *
 * // Protect bot endpoint with API key
 * export const POST = withBotAuth(async (req) => { ... });
 *
 * // Verify webhook signatures
 * export const POST = withWebhookAuth(async (req) => { ... }, { provider: 'github' });
 *
 * // Apply rate limiting
 * export const GET = withRateLimit(async (req) => { ... });
 *
 * // Compose multiple middleware
 * export const POST = withRateLimit(withAuth(async (req) => { ... }));
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import {
  verifyGitHubWebhook,
  verifyVercelWebhook,
} from '@/lib/webhooks/verify';

/**
 * Type definitions for middleware configuration
 */

export type AuthMiddlewareConfig = {
  adminEmails?: string[];
};

export type BotAuthConfig = {
  headerName?: string;
  prefix?: string;
  apiKeys?: string[];
};

export type WebhookAuthConfig = {
  provider: 'github' | 'vercel' | 'custom';
  secret?: string;
  headerName?: string;
  verifyFn?: (payload: string, signature: string, secret: string) => boolean;
};

export type RateLimitConfig = {
  limit?: number;
  windowMs?: number;
};

/**
 * NextRequest handler type
 */
type NextHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Rate limit storage: IP -> { count, resetAt }
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract IP address from request headers
 */
function getClientIp(req: NextRequest): string {
  // Try x-forwarded-for first (most common in production)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Try x-real-ip next
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to unknown
  return 'unknown';
}

/**
 * Cleanup expired rate limit entries
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * withAuth - NextAuth Google OAuth Middleware
 *
 * Validates that the user has an active NextAuth session and is an admin.
 * Admin email(s) are configured via ADMIN_EMAIL environment variable or config.
 *
 * @param handler - The Next.js API route handler to protect
 * @param config - Optional configuration (admin emails)
 * @returns Protected handler
 */
export function withAuth(
  handler: NextHandler,
  config?: AuthMiddlewareConfig
): NextHandler {
  return async (req: NextRequest) => {
    try {
      // Get admin emails from config or environment variable
      const adminEmails =
        config?.adminEmails ||
        (process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : null);

      if (!adminEmails) {
        throw new Error('ADMIN_EMAIL environment variable is not defined');
      }

      // Get server session
      const session = await getServerSession();

      // Check if session exists
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized - No session found' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const userEmail = session.user.email;
      if (!userEmail || !adminEmails.includes(userEmail)) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      // User is authenticated and authorized - call handler
      return handler(req);
    } catch (error) {
      // Handle errors (e.g., session retrieval failure)
      if (error instanceof Error && error.message.includes('ADMIN_EMAIL')) {
        throw error; // Re-throw configuration errors
      }

      return NextResponse.json(
        { error: 'Authentication failed - ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 401 }
      );
    }
  };
}

/**
 * withBotAuth - Bot API Key Middleware
 *
 * Validates that the request contains a valid Bot API key in the x-api-key header.
 * API key is configured via BOT_API_KEY environment variable or config.
 *
 * @param handler - The Next.js API route handler to protect
 * @param config - Optional configuration (header name, prefix, multiple keys)
 * @returns Protected handler
 */
export function withBotAuth(
  handler: NextHandler,
  config?: BotAuthConfig
): NextHandler {
  return async (req: NextRequest) => {
    try {
      // Get configuration
      const headerName = config?.headerName || 'x-api-key';
      const prefix = config?.prefix || '';
      const validApiKeys =
        config?.apiKeys ||
        (process.env.BOT_API_KEY ? [process.env.BOT_API_KEY] : null);

      if (!validApiKeys) {
        throw new Error('BOT_API_KEY environment variable is not defined');
      }

      // Get API key from header
      const apiKey = req.headers.get(headerName);

      // Check if API key is present
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Unauthorized - Missing API key' },
          { status: 401 }
        );
      }

      // Remove prefix if configured
      const cleanApiKey = prefix ? apiKey.replace(prefix, '') : apiKey;

      // Validate API key
      if (!validApiKeys.includes(cleanApiKey)) {
        return NextResponse.json(
          { error: 'Forbidden - Invalid API key' },
          { status: 403 }
        );
      }

      // API key is valid - call handler
      return handler(req);
    } catch (error) {
      // Handle errors
      if (error instanceof Error && error.message.includes('BOT_API_KEY')) {
        throw error; // Re-throw configuration errors
      }

      return NextResponse.json(
        { error: 'Authentication failed - ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 401 }
      );
    }
  };
}

/**
 * withWebhookAuth - Webhook Signature Verification Middleware
 *
 * Validates webhook signatures from GitHub, Vercel, or custom providers.
 * Uses HMAC-based signature verification with timing-attack protection.
 *
 * @param handler - The Next.js API route handler to protect
 * @param config - Webhook configuration (provider, secret, custom verify function)
 * @returns Protected handler
 */
export function withWebhookAuth(
  handler: NextHandler,
  config: WebhookAuthConfig
): NextHandler {
  return async (req: NextRequest) => {
    try {
      const { provider } = config;

      // Get webhook secret
      let secret = config.secret;
      if (!secret) {
        if (provider === 'github') {
          secret = process.env.GITHUB_WEBHOOK_SECRET;
          if (!secret) {
            throw new Error(
              'GITHUB_WEBHOOK_SECRET environment variable is not defined'
            );
          }
        } else if (provider === 'vercel') {
          secret = process.env.VERCEL_WEBHOOK_SECRET;
          if (!secret) {
            throw new Error(
              'VERCEL_WEBHOOK_SECRET environment variable is not defined'
            );
          }
        }
      }

      // Determine signature header name
      let headerName = config.headerName;
      if (!headerName) {
        if (provider === 'github') {
          headerName = 'x-hub-signature-256';
        } else if (provider === 'vercel') {
          headerName = 'x-vercel-signature';
        }
      }

      if (!headerName) {
        throw new Error('Webhook signature header name not configured');
      }

      // Get signature from header
      const signature = req.headers.get(headerName);
      if (!signature) {
        return NextResponse.json(
          { error: 'Unauthorized - Missing webhook signature' },
          { status: 401 }
        );
      }

      // Read request body as text
      const payload = await req.text();

      // Verify signature based on provider
      let isValid = false;

      if (config.verifyFn) {
        // Custom verification function
        isValid = config.verifyFn(payload, signature, secret!);
      } else if (provider === 'github') {
        isValid = verifyGitHubWebhook(payload, signature, secret!);
      } else if (provider === 'vercel') {
        isValid = verifyVercelWebhook(payload, signature, secret!);
      }

      if (!isValid) {
        return NextResponse.json(
          { error: 'Forbidden - Invalid webhook signature' },
          { status: 403 }
        );
      }

      // Signature is valid - call handler
      return handler(req);
    } catch (error) {
      // Handle errors
      if (error instanceof Error && error.message.includes('environment variable')) {
        throw error; // Re-throw configuration errors
      }

      return NextResponse.json(
        { error: 'Webhook verification failed - ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 401 }
      );
    }
  };
}

/**
 * withRateLimit - Rate Limiting Middleware
 *
 * Implements IP-based rate limiting to prevent abuse.
 * Default: 10 requests per minute per IP.
 *
 * @param handler - The Next.js API route handler to protect
 * @param config - Optional configuration (limit, time window)
 * @returns Protected handler
 */
export function withRateLimit(
  handler: NextHandler,
  config?: RateLimitConfig
): NextHandler {
  return async (req: NextRequest) => {
    // Configuration
    const limit = config?.limit || 10;
    const windowMs = config?.windowMs || 60000; // 1 minute

    // Get client IP
    const clientIp = getClientIp(req);

    // Get current time
    const now = Date.now();

    // Cleanup old entries periodically (every 100 requests)
    if (Math.random() < 0.01) {
      cleanupRateLimitStore();
    }

    // Get or create rate limit data for this IP
    let rateLimitData = rateLimitStore.get(clientIp);

    if (!rateLimitData || now > rateLimitData.resetAt) {
      // Create new rate limit window
      rateLimitData = {
        count: 0,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(clientIp, rateLimitData);
    }

    // Increment request count
    rateLimitData.count++;

    // Calculate remaining requests
    const remaining = Math.max(0, limit - rateLimitData.count);

    // Check if rate limit exceeded
    if (rateLimitData.count > limit) {
      // Calculate retry-after in seconds
      const retryAfter = Math.ceil((rateLimitData.resetAt - now) / 1000);

      return NextResponse.json(
        { error: 'Too Many Requests - Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitData.resetAt.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Call handler and add rate limit headers to response
    const response = await handler(req);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitData.resetAt.toString());

    return response;
  };
}
