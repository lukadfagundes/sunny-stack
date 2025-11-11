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
 * Database configuration schema (1 variable)
 */
const databaseSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
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
 * Google OAuth configuration schema (4 variables)
 */
const googleSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URI: z.string().url('GOOGLE_REDIRECT_URI must be a valid URL'),
  GOOGLE_PROJECT_ID: z.string().min(1, 'GOOGLE_PROJECT_ID is required'),
});

/**
 * Discord bot configuration schema
 */
const discordSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(50, 'DISCORD_BOT_TOKEN must be a valid Discord bot token'),
  DISCORD_APPLICATION_ID: z.string().min(15, 'DISCORD_APPLICATION_ID must be a valid Discord application ID'),
  DISCORD_GUILD_ID: z.string().min(15, 'DISCORD_GUILD_ID must be a valid Discord server ID'),
  DISCORD_ADMIN_USER_ID: z.string().min(15, 'DISCORD_ADMIN_USER_ID must be a valid Discord user ID'),
});

/**
 * Discord channel configuration schema (13 channels)
 */
const discordChannelSchema = z.object({
  // Administrative channels
  DISCORD_CHANNEL_ADMIN_LOGS: z.string().min(15, 'DISCORD_CHANNEL_ADMIN_LOGS must be a valid Discord channel ID'),
  DISCORD_CHANNEL_BOT_COMMANDS: z.string().min(15, 'DISCORD_CHANNEL_BOT_COMMANDS must be a valid Discord channel ID'),

  // Project management channels
  DISCORD_CHANNEL_ACTIVE_PROJECTS: z.string().min(15, 'DISCORD_CHANNEL_ACTIVE_PROJECTS must be a valid Discord channel ID'),
  DISCORD_CHANNEL_PROPOSALS: z.string().min(15, 'DISCORD_CHANNEL_PROPOSALS must be a valid Discord channel ID'),
  DISCORD_CHANNEL_TASKS: z.string().min(15, 'DISCORD_CHANNEL_TASKS must be a valid Discord channel ID'),
  DISCORD_CHANNEL_TIME_TRACKING: z.string().min(15, 'DISCORD_CHANNEL_TIME_TRACKING must be a valid Discord channel ID'),

  // Client communication channels
  DISCORD_CHANNEL_CLIENT_INQUIRIES: z.string().min(15, 'DISCORD_CHANNEL_CLIENT_INQUIRIES must be a valid Discord channel ID'),
  DISCORD_CHANNEL_CLIENT_UPDATES: z.string().min(15, 'DISCORD_CHANNEL_CLIENT_UPDATES must be a valid Discord channel ID'),

  // Automation & monitoring channels
  DISCORD_CHANNEL_CALENDAR_SYNC: z.string().min(15, 'DISCORD_CHANNEL_CALENDAR_SYNC must be a valid Discord channel ID'),
  DISCORD_CHANNEL_EMAIL_NOTIFICATIONS: z.string().min(15, 'DISCORD_CHANNEL_EMAIL_NOTIFICATIONS must be a valid Discord channel ID'),
  DISCORD_CHANNEL_ANALYTICS: z.string().min(15, 'DISCORD_CHANNEL_ANALYTICS must be a valid Discord channel ID'),

  // Financial channels
  DISCORD_CHANNEL_INVOICES: z.string().min(15, 'DISCORD_CHANNEL_INVOICES must be a valid Discord channel ID'),
  DISCORD_CHANNEL_PAYMENTS: z.string().min(15, 'DISCORD_CHANNEL_PAYMENTS must be a valid Discord channel ID'),
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
 * Deployment & CI/CD API tokens schema
 */
const deploymentApiSchema = z.object({
  GITHUB_API_TOKEN: z.string().min(20, 'GITHUB_API_TOKEN must be at least 20 characters'),
  VERCEL_API_TOKEN: z.string().min(20, 'VERCEL_API_TOKEN must be at least 20 characters'),
});

/**
 * Infrastructure monitoring API tokens schema
 */
const monitoringSchema = z.object({
  FLY_API_TOKEN: z.string().optional(),
  FLY_ORG_SLUG: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CRONJOB_API_KEY: z.string().optional(),
});

/**
 * Complete configuration schema (47 variables)
 * - Database: 1
 * - NextAuth: 3
 * - Admin: 2
 * - Google OAuth: 4
 * - Discord: 17 (4 bot + 13 channels)
 * - Bot API: 2
 * - Email: 1
 * - Deployment APIs: 2
 * - Infrastructure Monitoring: 5
 * - Error Monitoring: 1 (Rollbar)
 * - CI/CD: 1 (Discord webhook)
 * - Deployment: 2 (GitHub username, Pi SSH passphrase)
 */
const configSchema = z.object({
  ...databaseSchema.shape,
  ...nextAuthSchema.shape,
  ...adminSchema.shape,
  ...googleSchema.shape,
  ...discordSchema.shape,
  ...discordChannelSchema.shape,
  ...botApiSchema.shape,
  ...emailSchema.shape,
  ...deploymentApiSchema.shape,
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
    // Database (1)
    DATABASE_URL: process.env.DATABASE_URL,

    // NextAuth (3)
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,

    // Admin (2)
    ADMIN_ROUTE_HASH: process.env.ADMIN_ROUTE_HASH,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,

    // Google OAuth (4)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,

    // Discord Bot (4)
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
    DISCORD_ADMIN_USER_ID: process.env.DISCORD_ADMIN_USER_ID,

    // Discord Channels (13)
    DISCORD_CHANNEL_ADMIN_LOGS: process.env.DISCORD_CHANNEL_ADMIN_LOGS,
    DISCORD_CHANNEL_BOT_COMMANDS: process.env.DISCORD_CHANNEL_BOT_COMMANDS,
    DISCORD_CHANNEL_ACTIVE_PROJECTS: process.env.DISCORD_CHANNEL_ACTIVE_PROJECTS,
    DISCORD_CHANNEL_PROPOSALS: process.env.DISCORD_CHANNEL_PROPOSALS,
    DISCORD_CHANNEL_TASKS: process.env.DISCORD_CHANNEL_TASKS,
    DISCORD_CHANNEL_TIME_TRACKING: process.env.DISCORD_CHANNEL_TIME_TRACKING,
    DISCORD_CHANNEL_CLIENT_INQUIRIES: process.env.DISCORD_CHANNEL_CLIENT_INQUIRIES,
    DISCORD_CHANNEL_CLIENT_UPDATES: process.env.DISCORD_CHANNEL_CLIENT_UPDATES,
    DISCORD_CHANNEL_CALENDAR_SYNC: process.env.DISCORD_CHANNEL_CALENDAR_SYNC,
    DISCORD_CHANNEL_EMAIL_NOTIFICATIONS: process.env.DISCORD_CHANNEL_EMAIL_NOTIFICATIONS,
    DISCORD_CHANNEL_ANALYTICS: process.env.DISCORD_CHANNEL_ANALYTICS,
    DISCORD_CHANNEL_INVOICES: process.env.DISCORD_CHANNEL_INVOICES,
    DISCORD_CHANNEL_PAYMENTS: process.env.DISCORD_CHANNEL_PAYMENTS,

    // Bot API (2)
    BOT_API_KEY: process.env.BOT_API_KEY,
    BOT_API_URL: process.env.BOT_API_URL,

    // Email (1)
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Deployment & CI/CD APIs (2)
    GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,

    // Infrastructure Monitoring APIs (5)
    FLY_API_TOKEN: process.env.FLY_API_TOKEN,
    FLY_ORG_SLUG: process.env.FLY_ORG_SLUG,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID,
    CRONJOB_API_KEY: process.env.CRONJOB_API_KEY,
  };

  // Validate with zod
  const result = configSchema.safeParse(config);

  if (!result.success && result.error) {
    result.error.issues.forEach((issue) => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    });
  }

  // Check for optional but recommended variables
  const optionalVars = [
    'FLY_API_TOKEN',
    'FLY_ORG_SLUG',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ZONE_ID',
    'CRONJOB_API_KEY'
  ];
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

  console.log('\nGoogle OAuth:');
  console.log(`  ✓ GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ GOOGLE_PROJECT_ID: ${process.env.GOOGLE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);

  console.log('\nDiscord Bot:');
  console.log(`  ✓ DISCORD_BOT_TOKEN: ${process.env.DISCORD_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ DISCORD_GUILD_ID: ${process.env.DISCORD_GUILD_ID || '❌ Missing'}`);

  console.log('\nDiscord Channels (13):');
  const channelCount = [
    process.env.DISCORD_CHANNEL_ADMIN_LOGS,
    process.env.DISCORD_CHANNEL_BOT_COMMANDS,
    process.env.DISCORD_CHANNEL_ACTIVE_PROJECTS,
    process.env.DISCORD_CHANNEL_PROPOSALS,
    process.env.DISCORD_CHANNEL_TASKS,
    process.env.DISCORD_CHANNEL_TIME_TRACKING,
    process.env.DISCORD_CHANNEL_CLIENT_INQUIRIES,
    process.env.DISCORD_CHANNEL_CLIENT_UPDATES,
    process.env.DISCORD_CHANNEL_CALENDAR_SYNC,
    process.env.DISCORD_CHANNEL_EMAIL_NOTIFICATIONS,
    process.env.DISCORD_CHANNEL_ANALYTICS,
    process.env.DISCORD_CHANNEL_INVOICES,
    process.env.DISCORD_CHANNEL_PAYMENTS,
  ].filter(v => v).length;
  console.log(`  ✓ ${channelCount}/13 channels configured`);

  console.log('\nDeployment & CI/CD APIs:');
  console.log(`  ✓ GITHUB_API_TOKEN: ${process.env.GITHUB_API_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  ✓ VERCEL_API_TOKEN: ${process.env.VERCEL_API_TOKEN ? '✅ Set' : '❌ Missing'}`);

  console.log('\nInfrastructure Monitoring APIs (Optional):');
  console.log(`  ✓ FLY_API_TOKEN: ${process.env.FLY_API_TOKEN ? '✅ Set' : '⚠️  Not set'}`);
  console.log(`  ✓ FLY_ORG_SLUG: ${process.env.FLY_ORG_SLUG ? '✅ Set' : '⚠️  Not set'}`);
  console.log(`  ✓ CLOUDFLARE_API_TOKEN: ${process.env.CLOUDFLARE_API_TOKEN ? '✅ Set' : '⚠️  Not set'}`);
  console.log(`  ✓ CLOUDFLARE_ZONE_ID: ${process.env.CLOUDFLARE_ZONE_ID ? '✅ Set' : '⚠️  Not set'}`);
  console.log(`  ✓ CRONJOB_API_KEY: ${process.env.CRONJOB_API_KEY ? '✅ Set' : '⚠️  Not set'}`);

  console.log('');
}

// =============================================================================
// CLI Usage
// =============================================================================

// Note: CLI usage moved to scripts/validate-env.ts
// This file is now a pure library module to avoid import-time side effects
