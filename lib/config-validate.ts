/**
 * Configuration Validation
 *
 * Validates all required environment variables are present and properly formatted.
 * Run this before starting the bot or during build to catch config issues early.
 */

import { z } from 'zod';

// =============================================================================
// Validation Schemas
// =============================================================================

/**
 * Database configuration schema
 */
const databaseSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  POSTGRES_URL_NON_POOLING: z.string().url().optional(),
});

/**
 * Next.js & Authentication configuration schema
 */
const nextAuthSchema = z.object({
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Admin dashboard configuration schema
 */
const adminSchema = z.object({
  ADMIN_ROUTE_HASH: z.string().length(64, 'ADMIN_ROUTE_HASH must be exactly 64 characters (hex)'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address'),
});

/**
 * Google OAuth & APIs configuration schema
 */
const googleSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url('GOOGLE_REDIRECT_URI must be a valid URL'),
  GOOGLE_REFRESH_TOKEN: z.string().min(1, 'GOOGLE_REFRESH_TOKEN is required'),
  GOOGLE_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().email().optional(),
});

/**
 * Discord bot configuration schema
 */
const discordSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(50, 'DISCORD_BOT_TOKEN must be a valid Discord bot token'),
  DISCORD_APPLICATION_ID: z.string().min(15, 'DISCORD_APPLICATION_ID must be a valid Discord application ID'),
  DISCORD_GUILD_ID: z.string().min(15, 'DISCORD_GUILD_ID must be a valid Discord server ID'),
  DISCORD_ADMIN_USER_ID: z.string().min(15, 'DISCORD_ADMIN_USER_ID must be a valid Discord user ID'),
  DISCORD_ADMIN_CHANNEL_ID: z.string().min(15, 'DISCORD_ADMIN_CHANNEL_ID must be a valid Discord channel ID'),
  DISCORD_ALERT_CRITICAL_CHANNEL_ID: z.string().min(15, 'DISCORD_ALERT_CRITICAL_CHANNEL_ID must be a valid Discord channel ID'),
  DISCORD_MONITORING_CHANNEL_ID: z.string().min(15, 'DISCORD_MONITORING_CHANNEL_ID must be a valid Discord channel ID'),
});

/**
 * Bot API authentication schema
 */
const botApiSchema = z.object({
  BOT_API_KEY: z.string().min(32, 'BOT_API_KEY must be at least 32 characters'),
  BOT_API_URL: z.string().url('BOT_API_URL must be a valid URL'),
});

/**
 * Email configuration schema
 */
const emailSchema = z.object({
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with "re_"'),
});

/**
 * Webhook configuration schema
 */
const webhookSchema = z.object({
  GITHUB_WEBHOOK_SECRET: z.string().min(20, 'GITHUB_WEBHOOK_SECRET must be at least 20 characters'),
  VERCEL_WEBHOOK_SECRET: z.string().min(20, 'VERCEL_WEBHOOK_SECRET must be at least 20 characters'),
});

/**
 * Optional monitoring services schema
 */
const monitoringSchema = z.object({
  FLY_API_TOKEN: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CRONJOB_API_KEY: z.string().optional(),
});

/**
 * Complete configuration schema
 */
const configSchema = z.object({
  ...databaseSchema.shape,
  ...nextAuthSchema.shape,
  ...adminSchema.shape,
  ...googleSchema.shape,
  ...discordSchema.shape,
  ...botApiSchema.shape,
  ...emailSchema.shape,
  ...webhookSchema.shape,
  ...monitoringSchema.shape,
});

// =============================================================================
// Validation Functions
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    configured: number;
    missing: number;
    optional: number;
  };
}

/**
 * Validate all environment variables
 */
export function validateConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const config = {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,

    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,

    ADMIN_ROUTE_HASH: process.env.ADMIN_ROUTE_HASH,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,

    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
    DISCORD_ADMIN_USER_ID: process.env.DISCORD_ADMIN_USER_ID,
    DISCORD_ADMIN_CHANNEL_ID: process.env.DISCORD_ADMIN_CHANNEL_ID,
    DISCORD_ALERT_CRITICAL_CHANNEL_ID: process.env.DISCORD_ALERT_CRITICAL_CHANNEL_ID,
    DISCORD_MONITORING_CHANNEL_ID: process.env.DISCORD_MONITORING_CHANNEL_ID,

    BOT_API_KEY: process.env.BOT_API_KEY,
    BOT_API_URL: process.env.BOT_API_URL,

    RESEND_API_KEY: process.env.RESEND_API_KEY,

    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    VERCEL_WEBHOOK_SECRET: process.env.VERCEL_WEBHOOK_SECRET,

    FLY_API_TOKEN: process.env.FLY_API_TOKEN,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CRONJOB_API_KEY: process.env.CRONJOB_API_KEY,
  };

  // Validate with zod
  const result = configSchema.safeParse(config);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      errors.push(`${error.path.join('.')}: ${error.message}`);
    });
  }

  // Check for optional but recommended variables
  const optionalVars = ['FLY_API_TOKEN', 'CLOUDFLARE_API_TOKEN', 'CRONJOB_API_KEY'];
  optionalVars.forEach((varName) => {
    if (!process.env[varName]) {
      warnings.push(`${varName} is not set (optional - monitoring will be limited)`);
    }
  });

  // Count configured variables
  const totalVars = Object.keys(config).length;
  const configuredVars = Object.values(config).filter(v => v && v.length > 0).length;
  const missingVars = totalVars - configuredVars;
  const optionalVarsCount = optionalVars.filter(v => !process.env[v]).length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      total: totalVars,
      configured: configuredVars,
      missing: missingVars,
      optional: optionalVarsCount,
    },
  };
}

/**
 * Validate configuration and throw error if invalid
 */
export function validateConfigOrThrow(): void {
  const result = validateConfig();

  if (!result.valid) {
    const errorMessage = [
      '❌ Configuration validation failed!',
      '',
      'Errors:',
      ...result.errors.map(e => `  - ${e}`),
      '',
      `Missing ${result.summary.missing} required variables out of ${result.summary.total} total.`,
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    result.warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }

  console.log('✅ Configuration validation passed!');
  console.log(`   ${result.summary.configured}/${result.summary.total} variables configured`);
  if (result.summary.optional > 0) {
    console.log(`   ${result.summary.optional} optional variables not set`);
  }
}

/**
 * Print configuration summary (without exposing secrets)
 */
export function printConfigSummary(): void {
  console.log('\n📋 Configuration Summary\n');
  console.log('Database:');
  console.log(`  ✓ DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);

  console.log('\nAuthentication:');
  console.log(`  ✓ NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '❌ Missing'}`);
  console.log(`  ✓ ADMIN_ROUTE_HASH: ${process.env.ADMIN_ROUTE_HASH ? '✅ Set' : '❌ Missing'}`);

  console.log('\nGoogle APIs:');
  console.log(`  ✓ GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ GOOGLE_REFRESH_TOKEN: ${process.env.GOOGLE_REFRESH_TOKEN ? '✅ Set' : '❌ Missing'}`);

  console.log('\nDiscord Bot:');
  console.log(`  ✓ DISCORD_BOT_TOKEN: ${process.env.DISCORD_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ DISCORD_GUILD_ID: ${process.env.DISCORD_GUILD_ID || '❌ Missing'}`);

  console.log('\nWebhooks:');
  console.log(`  ✓ GITHUB_WEBHOOK_SECRET: ${process.env.GITHUB_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ VERCEL_WEBHOOK_SECRET: ${process.env.VERCEL_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);

  console.log('\nMonitoring (Optional):');
  console.log(`  ✓ FLY_API_TOKEN: ${process.env.FLY_API_TOKEN ? '✅ Set' : '⚠️  Not set'}`);
  console.log(`  ✓ CLOUDFLARE_API_TOKEN: ${process.env.CLOUDFLARE_API_TOKEN ? '✅ Set' : '⚠️  Not set'}`);
  console.log(`  ✓ CRONJOB_API_KEY: ${process.env.CRONJOB_API_KEY ? '✅ Set' : '⚠️  Not set'}`);

  console.log('');
}

// =============================================================================
// CLI Usage
// =============================================================================

if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  try {
    validateConfigOrThrow();
    printConfigSummary();
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
