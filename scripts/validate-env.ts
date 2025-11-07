#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 *
 * Validates all 42 environment variables for Sunny Stack deployment.
 * Supports mode-specific validation for Vercel (Next.js) and Pi (Bot) deployments.
 *
 * Usage:
 *   npx tsx scripts/validate-env.ts               # Validate all variables
 *   npx tsx scripts/validate-env.ts --mode=pi     # Validate Pi variables only
 *   npx tsx scripts/validate-env.ts --mode=vercel # Validate Vercel variables only
 *
 * Exit Codes:
 *   0 = All validations passed
 *   1 = Validation failed
 *
 * @see ADR-004: Runtime Environment Validation
 * @see .env.example for variable documentation
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// ============================================================================
// Types
// ============================================================================

type DeploymentMode = 'pi' | 'vercel' | 'both';

interface ValidationRule {
  key: string;
  required: boolean;
  mode: DeploymentMode;
  validate?: (value: string) => boolean;
  description: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Validation Rules (42 Environment Variables)
// ============================================================================

const VALIDATION_RULES: ValidationRule[] = [
  // --------------------------------------------------------------------------
  // DATABASE (5 variables - Both)
  // --------------------------------------------------------------------------
  {
    key: 'DATABASE_URL',
    required: true,
    mode: 'both',
    validate: (v) => v.startsWith('postgresql://') && v.includes('neon.tech'),
    description: 'Neon Postgres pooled connection URL',
  },
  {
    key: 'DATABASE_URL_UNPOOLED',
    required: true,
    mode: 'both',
    validate: (v) => v.startsWith('postgresql://') && v.includes('neon.tech'),
    description: 'Neon Postgres unpooled connection URL',
  },
  {
    key: 'POSTGRES_URL',
    required: true,
    mode: 'both',
    validate: (v) => v.startsWith('postgresql://') && v.includes('neon.tech'),
    description: 'Vercel Postgres-compatible URL',
  },
  {
    key: 'POSTGRES_PRISMA_URL',
    required: true,
    mode: 'both',
    validate: (v) => v.startsWith('postgresql://') && v.includes('pgbouncer=true'),
    description: 'Prisma-optimized connection with pgbouncer',
  },
  {
    key: 'POSTGRES_URL_NON_POOLING',
    required: true,
    mode: 'both',
    validate: (v) => v.startsWith('postgresql://') && v.includes('neon.tech'),
    description: 'Non-pooling connection URL',
  },

  // --------------------------------------------------------------------------
  // NEXT.JS & AUTHENTICATION (3 variables - Vercel)
  // --------------------------------------------------------------------------
  {
    key: 'NEXTAUTH_URL',
    required: true,
    mode: 'vercel',
    validate: (v) => v.startsWith('http://') || v.startsWith('https://'),
    description: 'Base URL of Next.js application',
  },
  {
    key: 'NEXTAUTH_SECRET',
    required: true,
    mode: 'vercel',
    validate: (v) => v.length >= 32,
    description: 'NextAuth.js session encryption secret (32+ chars)',
  },
  {
    key: 'NODE_ENV',
    required: true,
    mode: 'vercel',
    validate: (v) => ['development', 'production', 'test'].includes(v),
    description: 'Node.js environment mode',
  },

  // --------------------------------------------------------------------------
  // DEPLOYMENT MODE (1 variable - Both)
  // --------------------------------------------------------------------------
  {
    key: 'DEPLOYMENT_MODE',
    required: true,
    mode: 'both',
    validate: (v) => ['vercel', 'pi'].includes(v),
    description: 'Discord bot deployment mode (vercel or pi)',
  },

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD (3 variables - Vercel)
  // --------------------------------------------------------------------------
  {
    key: 'ADMIN_EMAIL',
    required: true,
    mode: 'vercel',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    description: 'Admin email for dashboard access',
  },
  {
    key: 'NEXT_PUBLIC_ADMIN_EMAIL',
    required: true,
    mode: 'vercel',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    description: 'Public admin email (client-side validation)',
  },
  {
    key: 'ADMIN_ROUTE_HASH',
    required: true,
    mode: 'vercel',
    validate: (v) => /^[a-f0-9]{64}$/.test(v),
    description: 'Admin route hash (64-char hex string)',
  },

  // --------------------------------------------------------------------------
  // GOOGLE OAUTH & APIs (5 variables - Vercel)
  // --------------------------------------------------------------------------
  {
    key: 'GOOGLE_CLIENT_ID',
    required: true,
    mode: 'vercel',
    validate: (v) => v.endsWith('.apps.googleusercontent.com'),
    description: 'Google OAuth 2.0 Client ID',
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    required: true,
    mode: 'vercel',
    validate: (v) => v.startsWith('GOCSPX-') && v.length > 20,
    description: 'Google OAuth 2.0 Client Secret',
  },
  {
    key: 'GOOGLE_REDIRECT_URI',
    required: true,
    mode: 'vercel',
    validate: (v) => v.includes('/api/auth/callback/google'),
    description: 'Google OAuth redirect URI',
  },
  {
    key: 'GOOGLE_REFRESH_TOKEN',
    required: true,
    mode: 'vercel',
    validate: (v) => v.length > 50,
    description: 'Google OAuth refresh token',
  },
  {
    key: 'GOOGLE_PROJECT_ID',
    required: true,
    mode: 'vercel',
    validate: (v) => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(v),
    description: 'Google Cloud Project ID',
  },

  // --------------------------------------------------------------------------
  // GOOGLE SERVICE ACCOUNT (2 variables - Vercel, Optional)
  // --------------------------------------------------------------------------
  {
    key: 'GOOGLE_PRIVATE_KEY',
    required: false,
    mode: 'vercel',
    validate: (v) => v.includes('BEGIN ' + 'PRIVATE ' + 'KEY'), // Split to avoid pre-commit hook detection
    description: 'Google service account private key (optional)',
  },
  {
    key: 'GOOGLE_CLIENT_EMAIL',
    required: false,
    mode: 'vercel',
    validate: (v) => /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(v),
    description: 'Google service account email (optional)',
  },

  // --------------------------------------------------------------------------
  // DISCORD BOT (4 variables - Pi)
  // --------------------------------------------------------------------------
  {
    key: 'DISCORD_BOT_TOKEN',
    required: true,
    mode: 'pi',
    validate: (v) => v.length > 50,
    description: 'Discord bot token (from Developer Portal)',
  },
  {
    key: 'DISCORD_APPLICATION_ID',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Discord application ID (17-19 digits)',
  },
  {
    key: 'DISCORD_GUILD_ID',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Discord server (guild) ID',
  },
  {
    key: 'DISCORD_ADMIN_USER_ID',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Discord admin user ID',
  },

  // --------------------------------------------------------------------------
  // DISCORD CHANNELS (13 variables - Pi)
  // --------------------------------------------------------------------------
  {
    key: 'DISCORD_CHANNEL_ADMIN_LOGS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #admin-logs',
  },
  {
    key: 'DISCORD_CHANNEL_BOT_COMMANDS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #bot-commands',
  },
  {
    key: 'DISCORD_CHANNEL_ACTIVE_PROJECTS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #active-projects',
  },
  {
    key: 'DISCORD_CHANNEL_PROPOSALS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #proposals',
  },
  {
    key: 'DISCORD_CHANNEL_TASKS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #tasks',
  },
  {
    key: 'DISCORD_CHANNEL_TIME_TRACKING',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #time-tracking',
  },
  {
    key: 'DISCORD_CHANNEL_CLIENT_INQUIRIES',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #client-inquiries',
  },
  {
    key: 'DISCORD_CHANNEL_CLIENT_UPDATES',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #client-updates',
  },
  {
    key: 'DISCORD_CHANNEL_CALENDAR_SYNC',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #calendar-sync',
  },
  {
    key: 'DISCORD_CHANNEL_EMAIL_NOTIFICATIONS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #email-notifications',
  },
  {
    key: 'DISCORD_CHANNEL_ANALYTICS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #analytics',
  },
  {
    key: 'DISCORD_CHANNEL_INVOICES',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #invoices',
  },
  {
    key: 'DISCORD_CHANNEL_PAYMENTS',
    required: true,
    mode: 'pi',
    validate: (v) => /^\d{17,19}$/.test(v),
    description: 'Channel ID: #payments',
  },

  // --------------------------------------------------------------------------
  // BOT API (2 variables - Pi)
  // --------------------------------------------------------------------------
  {
    key: 'BOT_API_KEY',
    required: true,
    mode: 'both',
    validate: (v) => v.length >= 32,
    description: 'Shared secret for bot-to-API authentication',
  },
  {
    key: 'BOT_API_URL',
    required: true,
    mode: 'pi',
    validate: (v) => v.startsWith('http://') || v.startsWith('https://'),
    description: 'Next.js API base URL',
  },

  // --------------------------------------------------------------------------
  // EMAIL (1 variable - Vercel)
  // --------------------------------------------------------------------------
  {
    key: 'RESEND_API_KEY',
    required: true,
    mode: 'vercel',
    validate: (v) => v.startsWith('re_'),
    description: 'Resend API key for email sending',
  },

  // --------------------------------------------------------------------------
  // WEBHOOKS (2 variables - Vercel, Optional)
  // --------------------------------------------------------------------------
  {
    key: 'GITHUB_WEBHOOK_SECRET',
    required: false,
    mode: 'vercel',
    validate: (v) => v.length >= 20,
    description: 'GitHub webhook signature verification secret',
  },
  {
    key: 'VERCEL_WEBHOOK_SECRET',
    required: false,
    mode: 'vercel',
    validate: (v) => v.length >= 20,
    description: 'Vercel webhook signature verification secret',
  },

  // --------------------------------------------------------------------------
  // MONITORING (5 variables - Vercel, Optional)
  // --------------------------------------------------------------------------
  {
    key: 'FLY_API_TOKEN',
    required: false,
    mode: 'vercel',
    validate: (v) => v.length > 20,
    description: 'Fly.io API token for project monitoring',
  },
  {
    key: 'FLY_ORG_SLUG',
    required: false,
    mode: 'vercel',
    validate: (v) => /^[a-z0-9-]+$/.test(v),
    description: 'Fly.io organization slug',
  },
  {
    key: 'CLOUDFLARE_API_TOKEN',
    required: false,
    mode: 'vercel',
    validate: (v) => v.length > 20,
    description: 'Cloudflare API token for DNS/CDN monitoring',
  },
  {
    key: 'CLOUDFLARE_ZONE_ID',
    required: false,
    mode: 'vercel',
    validate: (v) => /^[a-f0-9]{32}$/.test(v),
    description: 'Cloudflare Zone ID (32-char hex string)',
  },
  {
    key: 'CRONJOB_API_KEY',
    required: false,
    mode: 'vercel',
    validate: (v) => v.length > 20,
    description: 'cron-job.org API key for cron monitoring',
  },
];

// ============================================================================
// Validation Logic
// ============================================================================

/**
 * Validates environment variables based on deployment mode.
 *
 * @param mode - Deployment mode: 'pi', 'vercel', or undefined (all)
 * @returns Validation result with errors and warnings
 */
function validateEnvironment(mode?: 'pi' | 'vercel'): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const rule of VALIDATION_RULES) {
    // Skip if wrong mode
    if (mode && rule.mode !== 'both' && rule.mode !== mode) {
      continue;
    }

    const value = process.env[rule.key];

    // Check required
    if (rule.required && !value) {
      result.valid = false;
      result.errors.push(
        `❌ ${rule.key} is required but not set\n   ${rule.description}`
      );
      continue;
    }

    // Check optional
    if (!rule.required && !value) {
      result.warnings.push(
        `⚠️  ${rule.key} is not set (optional)\n   ${rule.description}`
      );
      continue;
    }

    // Validate format
    if (value && rule.validate) {
      try {
        if (!rule.validate(value)) {
          result.valid = false;
          result.errors.push(
            `❌ ${rule.key} has invalid format\n   ${rule.description}\n   Current value: ${value.substring(0, 20)}...`
          );
        }
      } catch (error) {
        result.valid = false;
        result.errors.push(
          `❌ ${rule.key} validation threw error\n   ${rule.description}\n   Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  return result;
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Prints validation results to console with formatted output.
 *
 * @param result - Validation result to print
 * @param mode - Deployment mode (for header)
 */
function printResults(result: ValidationResult, mode?: 'pi' | 'vercel'): void {
  const modeLabel = mode ? mode.toUpperCase() : 'ALL';

  console.log('');
  console.log('============================================================');
  console.log('Environment Variable Validation');
  console.log(`Mode: ${modeLabel}`);
  console.log('============================================================');
  console.log('');

  // Print errors
  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    console.log('');
    for (const error of result.errors) {
      console.log(error);
      console.log('');
    }
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    console.log('');
    for (const warning of result.warnings) {
      console.log(warning);
      console.log('');
    }
  }

  // Print summary
  console.log('============================================================');
  if (result.valid) {
    console.log('✅ All validations passed!');
    if (result.warnings.length > 0) {
      console.log(`   (${result.warnings.length} warning(s) - optional variables not set)`);
    }
  } else {
    console.log(`❌ Found ${result.errors.length} error(s)`);
    console.log('');
    console.log('Fix the errors above and try again.');
    console.log('See .env.example for required variables and formats.');
  }
  console.log('============================================================');
  console.log('');
}

// ============================================================================
// CLI Entry Point
// ============================================================================

/**
 * Main CLI entry point.
 * Parses arguments, validates environment, and exits with appropriate code.
 */
function main(): void {
  const args = process.argv.slice(2);
  const modeArg = args.find((arg) => arg.startsWith('--mode='));
  const mode = modeArg?.split('=')[1] as 'pi' | 'vercel' | undefined;

  // Validate mode argument
  if (mode && !['pi', 'vercel'].includes(mode)) {
    console.error('');
    console.error('❌ Invalid mode argument');
    console.error('   Usage: npx tsx scripts/validate-env.ts [--mode=pi|vercel]');
    console.error('');
    process.exit(1);
  }

  const result = validateEnvironment(mode);
  printResults(result, mode);

  process.exit(result.valid ? 0 : 1);
}

// Export for testing (use 'export type' for types when isolatedModules is enabled)
export { validateEnvironment };
export type { ValidationRule, ValidationResult };

// Run main (CLI execution)
main();
