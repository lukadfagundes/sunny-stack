/**
 * Config Validation Tests
 *
 * Tests for lib/config-validate.ts - validates all 47 environment variables
 * Following TDD methodology (RED-GREEN-REFACTOR)
 */

import { validateConfig, ValidationResult } from '../../lib/config-validate';

describe('config-validate', () => {
  // Store original env
  const originalEnv = process.env;

  // Helper to check if an error contains a string
  const hasError = (errors: string[], substring: string): boolean => {
    return errors.some(e => e.includes(substring));
  };

  beforeEach(() => {
    // Reset env before each test
    jest.resetModules();

    // Clear all env vars
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });

    // Restore original env
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Database Variables (5)', () => {
    test('should validate DATABASE_URL as required URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DATABASE_URL = 'not-a-url';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('DATABASE_URL'))).toBe(true);
    });

    test('should accept valid DATABASE_URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate DATABASE_URL_UNPOOLED as optional URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DATABASE_URL_UNPOOLED = 'not-a-url';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'DATABASE_URL_UNPOOLED')).toBe(true);
    });

    test('should validate POSTGRES_URL as optional URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.POSTGRES_URL = 'invalid';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
    });

    test('should validate POSTGRES_PRISMA_URL as optional URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.POSTGRES_PRISMA_URL = 'invalid';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
    });

    test('should validate POSTGRES_URL_NON_POOLING as optional URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.POSTGRES_URL_NON_POOLING = 'invalid';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
    });
  });

  describe('NextAuth Variables (3)', () => {
    test('should validate NEXTAUTH_URL as required URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.NEXTAUTH_URL = 'not-a-url';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'NEXTAUTH_URL')).toBe(true);
    });

    test('should validate NEXTAUTH_SECRET as required with min 32 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.NEXTAUTH_SECRET = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'NEXTAUTH_SECRET')).toBe(true);
    });

    test('should validate NODE_ENV as enum: development | production | test', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.NODE_ENV = 'invalid-env';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'NODE_ENV')).toBe(true);
    });

    test('should accept valid NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test'];

      validEnvs.forEach((env) => {
        // ARRANGE
        Object.assign(process.env, createValidEnv());
        process.env.NODE_ENV = env;

        // ACT
        const result = validateConfig();

        // ASSERT
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Admin Variables (2)', () => {
    test('should validate ADMIN_EMAIL as required valid email', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.ADMIN_EMAIL = 'not-an-email';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'ADMIN_EMAIL')).toBe(true);
    });

    test('should validate ADMIN_ROUTE_HASH as exactly 64 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.ADMIN_ROUTE_HASH = 'short-hash';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'ADMIN_ROUTE_HASH')).toBe(true);
    });
  });

  describe('Google API Variables (7)', () => {
    test('should validate GOOGLE_CLIENT_ID as required', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.GOOGLE_CLIENT_ID;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'GOOGLE_CLIENT_ID')).toBe(true);
    });

    test('should validate GOOGLE_CLIENT_SECRET as required', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.GOOGLE_CLIENT_SECRET;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'GOOGLE_CLIENT_SECRET')).toBe(true);
    });

    test('should validate GOOGLE_REDIRECT_URI as required URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.GOOGLE_REDIRECT_URI = 'not-a-url';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'GOOGLE_REDIRECT_URI')).toBe(true);
    });

    test('should validate GOOGLE_REFRESH_TOKEN as required', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.GOOGLE_REFRESH_TOKEN;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'GOOGLE_REFRESH_TOKEN')).toBe(true);
    });

    test('should validate GOOGLE_PROJECT_ID as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.GOOGLE_PROJECT_ID;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
    });

    test('should validate GOOGLE_PRIVATE_KEY as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.GOOGLE_PRIVATE_KEY;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
    });

    test('should validate GOOGLE_CLIENT_EMAIL as optional email', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.GOOGLE_CLIENT_EMAIL = 'not-an-email';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'GOOGLE_CLIENT_EMAIL')).toBe(true);
    });
  });

  describe('Discord Bot Variables (4)', () => {
    test('should validate DISCORD_BOT_TOKEN as required with min 50 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DISCORD_BOT_TOKEN = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'DISCORD_BOT_TOKEN')).toBe(true);
    });

    test('should validate DISCORD_APPLICATION_ID as required with min 15 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DISCORD_APPLICATION_ID = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'DISCORD_APPLICATION_ID')).toBe(true);
    });

    test('should validate DISCORD_GUILD_ID as required with min 15 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DISCORD_GUILD_ID = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'DISCORD_GUILD_ID')).toBe(true);
    });

    test('should validate DISCORD_ADMIN_USER_ID as required with min 15 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DISCORD_ADMIN_USER_ID = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'DISCORD_ADMIN_USER_ID')).toBe(true);
    });
  });

  describe('Discord Channel Variables (13)', () => {
    const channelIds = [
      'DISCORD_CHANNEL_ADMIN_LOGS',
      'DISCORD_CHANNEL_BOT_COMMANDS',
      'DISCORD_CHANNEL_ACTIVE_PROJECTS',
      'DISCORD_CHANNEL_PROPOSALS',
      'DISCORD_CHANNEL_TASKS',
      'DISCORD_CHANNEL_TIME_TRACKING',
      'DISCORD_CHANNEL_CLIENT_INQUIRIES',
      'DISCORD_CHANNEL_CLIENT_UPDATES',
      'DISCORD_CHANNEL_CALENDAR_SYNC',
      'DISCORD_CHANNEL_EMAIL_NOTIFICATIONS',
      'DISCORD_CHANNEL_ANALYTICS',
      'DISCORD_CHANNEL_INVOICES',
      'DISCORD_CHANNEL_PAYMENTS',
    ];

    test.each(channelIds)('should validate %s as required with min 15 characters', (channelId) => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env[channelId] = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, channelId)).toBe(true);
    });

    test.each(channelIds)('should require %s to be present', (channelId) => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env[channelId];

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, channelId)).toBe(true);
    });

    test('should accept valid Discord channel IDs (18-20 digit snowflakes)', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
    });
  });

  describe('Bot API Variables (2)', () => {
    test('should validate BOT_API_KEY as required with min 32 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.BOT_API_KEY = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'BOT_API_KEY')).toBe(true);
    });

    test('should validate BOT_API_URL as required URL', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.BOT_API_URL = 'not-a-url';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'BOT_API_URL')).toBe(true);
    });
  });

  describe('Email Variables (1)', () => {
    test('should validate RESEND_API_KEY as required starting with "re_"', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.RESEND_API_KEY = 'invalid_key';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'RESEND_API_KEY')).toBe(true);
      expect(hasError(result.errors, 're_')).toBe(true);
    });

    test('should accept valid RESEND_API_KEY', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.RESEND_API_KEY = 're_validkey123';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
    });
  });

  describe('Webhook Variables (2)', () => {
    test('should validate GITHUB_WEBHOOK_SECRET as required with min 20 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.GITHUB_WEBHOOK_SECRET = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'GITHUB_WEBHOOK_SECRET')).toBe(true);
    });

    test('should validate VERCEL_WEBHOOK_SECRET as required with min 20 characters', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.VERCEL_WEBHOOK_SECRET = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, 'VERCEL_WEBHOOK_SECRET')).toBe(true);
    });
  });

  describe('Monitoring Variables (5)', () => {
    test('should validate FLY_API_TOKEN as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.FLY_API_TOKEN;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(hasError(result.warnings, 'FLY_API_TOKEN')).toBe(true);
    });

    test('should validate FLY_ORG_SLUG as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.FLY_ORG_SLUG;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
    });

    test('should validate CLOUDFLARE_API_TOKEN as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.CLOUDFLARE_API_TOKEN;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(hasError(result.warnings, 'CLOUDFLARE_API_TOKEN')).toBe(true);
    });

    test('should validate CLOUDFLARE_ZONE_ID as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.CLOUDFLARE_ZONE_ID;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
    });

    test('should validate CRONJOB_API_KEY as optional', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      delete process.env.CRONJOB_API_KEY;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(hasError(result.warnings, 'CRONJOB_API_KEY')).toBe(true);
    });
  });

  describe('Summary Statistics', () => {
    test('should report correct total of 44 variables', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.summary.total).toBe(44);
    });

    test('should count configured variables correctly', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.summary.configured).toBeGreaterThanOrEqual(39); // Required + some optional
      expect(result.summary.configured).toBeLessThanOrEqual(44);
    });

    test('should calculate missing variables correctly', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.summary.missing).toBe(result.summary.total - result.summary.configured);
    });

    test('should count optional variables correctly', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      // Remove all optional monitoring variables
      delete process.env.FLY_API_TOKEN;
      delete process.env.FLY_ORG_SLUG;
      delete process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.CLOUDFLARE_ZONE_ID;
      delete process.env.CRONJOB_API_KEY;

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.summary.optional).toBeGreaterThanOrEqual(3); // At least 3 monitored as warnings
    });
  });

  describe('Error Messages', () => {
    test('should provide helpful error messages for URL validation', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.DATABASE_URL = 'not-a-url';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('DATABASE_URL') && e.toLowerCase().includes('url'))).toBe(true);
    });

    test('should provide helpful error messages for length validation', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.NEXTAUTH_SECRET = 'short';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('NEXTAUTH_SECRET') && e.includes('32'))).toBe(true);
    });

    test('should provide helpful error messages for format validation', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());
      process.env.ADMIN_EMAIL = 'not-an-email';

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('ADMIN_EMAIL') && e.toLowerCase().includes('email'))).toBe(true);
    });
  });

  describe('Complete Validation', () => {
    test('should pass validation with all 44 variables set correctly', () => {
      // ARRANGE
      Object.assign(process.env, createValidEnv());

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.total).toBe(44);
    });

    test('should handle missing required variables gracefully', () => {
      // ARRANGE
      process.env = {};

      // ACT
      const result = validateConfig();

      // ASSERT
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary.missing).toBeGreaterThan(0);
    });
  });
});

/**
 * Helper function to create a valid environment configuration
 * Returns an object with all 44 variables set to valid values
 */
function createValidEnv(): Record<string, string> {
  return {
    // Database (5)
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    DATABASE_URL_UNPOOLED: 'postgresql://user:pass@localhost:5432/db',
    POSTGRES_URL: 'postgresql://user:pass@localhost:5432/db',
    POSTGRES_PRISMA_URL: 'postgresql://user:pass@localhost:5432/db?pgbouncer=true',
    POSTGRES_URL_NON_POOLING: 'postgresql://user:pass@localhost:5432/db',

    // NextAuth (3)
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'a'.repeat(32), // 32 character minimum
    NODE_ENV: 'test',

    // Admin (2)
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_ROUTE_HASH: '0'.repeat(64), // 64 character hash

    // Google API (7)
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/callback/google',
    GOOGLE_REFRESH_TOKEN: 'test-refresh-token',
    GOOGLE_PROJECT_ID: 'test-project',
    GOOGLE_PRIVATE_KEY: 'test-private-key',
    GOOGLE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',

    // Discord Bot (4)
    DISCORD_BOT_TOKEN: 'M'.repeat(50), // 50+ characters for bot token
    DISCORD_APPLICATION_ID: '1'.repeat(18), // 18-digit snowflake
    DISCORD_GUILD_ID: '2'.repeat(18),
    DISCORD_ADMIN_USER_ID: '3'.repeat(18),

    // Discord Channels (13)
    DISCORD_CHANNEL_ADMIN_LOGS: '4'.repeat(18),
    DISCORD_CHANNEL_BOT_COMMANDS: '5'.repeat(18),
    DISCORD_CHANNEL_ACTIVE_PROJECTS: '6'.repeat(18),
    DISCORD_CHANNEL_PROPOSALS: '7'.repeat(18),
    DISCORD_CHANNEL_TASKS: '8'.repeat(18),
    DISCORD_CHANNEL_TIME_TRACKING: '9'.repeat(18),
    DISCORD_CHANNEL_CLIENT_INQUIRIES: '1'.repeat(19),
    DISCORD_CHANNEL_CLIENT_UPDATES: '2'.repeat(19),
    DISCORD_CHANNEL_CALENDAR_SYNC: '3'.repeat(19),
    DISCORD_CHANNEL_EMAIL_NOTIFICATIONS: '4'.repeat(19),
    DISCORD_CHANNEL_ANALYTICS: '5'.repeat(19),
    DISCORD_CHANNEL_INVOICES: '6'.repeat(19),
    DISCORD_CHANNEL_PAYMENTS: '7'.repeat(19),

    // Bot API (2)
    BOT_API_KEY: 'a'.repeat(32), // 32+ characters
    BOT_API_URL: 'http://localhost:3000/api',

    // Email (1)
    RESEND_API_KEY: 're_validkey123',

    // Webhooks (2)
    GITHUB_WEBHOOK_SECRET: 'a'.repeat(20), // 20+ characters
    VERCEL_WEBHOOK_SECRET: 'b'.repeat(20),

    // Monitoring (5)
    FLY_API_TOKEN: 'fly-token-123',
    FLY_ORG_SLUG: 'my-org',
    CLOUDFLARE_API_TOKEN: 'cloudflare-token-123',
    CLOUDFLARE_ZONE_ID: 'zone-id-123',
    CRONJOB_API_KEY: 'cronjob-key-123',
  };
}
