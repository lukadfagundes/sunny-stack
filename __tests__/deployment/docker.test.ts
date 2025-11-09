/**
 * Docker Deployment Tests
 *
 * Tests Docker build configuration, multi-stage build process,
 * and deployment-related functionality for the Discord bot.
 *
 * These tests verify:
 * - Dockerfile exists and is properly structured
 * - Health endpoint configuration
 * - Environment loading in Docker context
 * - Bot package.json has correct dependencies (4 only)
 * - Build scripts are properly configured
 *
 * @see ADR-001: Bot package.json approach
 * @see Dockerfile for multi-stage build configuration
 * @see DEPLOYMENT.md for deployment workflow
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Docker Deployment', () => {
  const rootDir = resolve(__dirname, '../..');
  const dockerfilePath = resolve(rootDir, 'Dockerfile');
  const botPackageJsonPath = resolve(rootDir, 'bot/package.json');
  const packageJsonPath = resolve(rootDir, 'package.json');

  describe('Dockerfile Configuration', () => {
    it('should have a Dockerfile in the root directory', () => {
      expect(existsSync(dockerfilePath)).toBe(true);
    });

    it('should use multi-stage build with deps, builder, and runner stages', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Check for all three stages (with optional platform flag)
      expect(dockerfile).toMatch(/FROM .*node:18-alpine AS deps/);
      expect(dockerfile).toMatch(/FROM .*node:18-alpine AS builder/);
      expect(dockerfile).toMatch(/FROM .*node:18-alpine AS runner/);
    });

    it('should install production dependencies only in deps stage', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find deps stage (accounting for platform flag)
      const depsStageStart = dockerfile.search(/FROM .*node:18-alpine AS deps/);
      const builderStageStart = dockerfile.search(/FROM .*node:18-alpine AS builder/);
      const depsStage = dockerfile.substring(depsStageStart, builderStageStart);

      // Check for production-only install
      expect(depsStage).toMatch(/npm ci --only=production/);
    });

    it('should build bot with TypeScript compilation', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find builder stage (accounting for platform flag)
      const builderStageStart = dockerfile.search(/FROM .*node:18-alpine AS builder/);
      const runnerStageStart = dockerfile.search(/FROM .*node:18-alpine AS runner/);
      const builderStage = dockerfile.substring(builderStageStart, runnerStageStart);

      // Check for TypeScript compilation (either npm run build:bot or tsc command)
      expect(builderStage).toMatch(/tsc|npm run build:bot/);
    });

    it('should use non-root user for security', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find runner stage (accounting for platform flag)
      const runnerStageStart = dockerfile.search(/FROM .*node:18-alpine AS runner/);
      const runnerStage = dockerfile.substring(runnerStageStart);

      // Check for user creation and usage
      expect(runnerStage).toMatch(/addgroup.*botuser/);
      expect(runnerStage).toMatch(/adduser.*botuser/);
      expect(runnerStage).toMatch(/USER botuser/);
    });

    it('should expose health check port 8080', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find runner stage
      const runnerStageStart = dockerfile.indexOf('FROM node:18-alpine AS runner');
      const runnerStage = dockerfile.substring(runnerStageStart);

      // Check for port exposure
      expect(runnerStage).toMatch(/EXPOSE 8080/);
      expect(runnerStage).toMatch(/PORT=8080/);
    });

    it('should have health check configured', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find runner stage
      const runnerStageStart = dockerfile.indexOf('FROM node:18-alpine AS runner');
      const runnerStage = dockerfile.substring(runnerStageStart);

      // Check for HEALTHCHECK instruction
      expect(runnerStage).toMatch(/HEALTHCHECK/);
      expect(runnerStage).toMatch(/\/health/);
    });

    it('should use dumb-init for proper signal handling', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find runner stage
      const runnerStageStart = dockerfile.indexOf('FROM node:18-alpine AS runner');
      const runnerStage = dockerfile.substring(runnerStageStart);

      // Check for dumb-init installation and usage
      expect(runnerStage).toMatch(/apk add.*dumb-init/);
      expect(runnerStage).toMatch(/ENTRYPOINT.*dumb-init/);
    });

    it('should start bot with node command', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find runner stage
      const runnerStageStart = dockerfile.indexOf('FROM node:18-alpine AS runner');
      const runnerStage = dockerfile.substring(runnerStageStart);

      // Check for CMD to start bot (either bot/index.js or bot/dist/index.js)
      expect(runnerStage).toMatch(/CMD.*node.*bot\/(dist\/)?index\.js/);
    });

    it('should set NODE_ENV to production in runner stage', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8');

      // Find runner stage
      const runnerStageStart = dockerfile.indexOf('FROM node:18-alpine AS runner');
      const runnerStage = dockerfile.substring(runnerStageStart);

      // Check for production environment
      expect(runnerStage).toMatch(/NODE_ENV=production/);
    });
  });

  describe('Bot Package Configuration', () => {
    it('should have bot/package.json file', () => {
      expect(existsSync(botPackageJsonPath)).toBe(true);
    });

    it('should have exactly 6 dependencies in bot/package.json', () => {
      const botPackageJson = JSON.parse(readFileSync(botPackageJsonPath, 'utf-8'));
      const dependencies = botPackageJson.dependencies || {};

      // Bot dependencies (updated from ADR-001):
      // discord.js, dotenv, @prisma/client, winston, winston-daily-rotate-file, @noble/ed25519
      expect(Object.keys(dependencies)).toHaveLength(6);
    });

    it('should have required bot dependencies: discord.js, dotenv, @prisma/client, winston, winston-daily-rotate-file, @noble/ed25519', () => {
      const botPackageJson = JSON.parse(readFileSync(botPackageJsonPath, 'utf-8'));
      const dependencies = botPackageJson.dependencies || {};

      // Check for required dependencies
      expect('discord.js' in dependencies).toBe(true);
      expect('dotenv' in dependencies).toBe(true);
      expect('@prisma/client' in dependencies).toBe(true);
      expect('winston' in dependencies).toBe(true);
      expect('winston-daily-rotate-file' in dependencies).toBe(true);
      expect('@noble/ed25519' in dependencies).toBe(true);
    });

    it('should not have devDependencies in bot/package.json', () => {
      const botPackageJson = JSON.parse(readFileSync(botPackageJsonPath, 'utf-8'));

      // Bot package.json should only have runtime dependencies
      expect(botPackageJson.devDependencies).toBeUndefined();
    });
  });

  describe('Build Scripts', () => {
    it('should have build:bot script in root package.json', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Check for bot build script
      expect(scripts).toHaveProperty('build:bot');
      expect(scripts['build:bot']).toContain('tsc');
      expect(scripts['build:bot']).toContain('tsconfig.bot.json');
    });

    it('should have bot:dev script for local development', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Check for bot dev script
      expect(scripts).toHaveProperty('bot:dev');
      expect(scripts['bot:dev']).toContain('tsx');
      expect(scripts['bot:dev']).toContain('bot/index.ts');
    });

    it('should have validation scripts for environment checking', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      // Check for validation scripts (Phase 5.0)
      expect(scripts).toHaveProperty('validate:env:pi');
      expect(scripts).toHaveProperty('validate:env:vercel');
      expect(scripts).toHaveProperty('validate:prerequisites');
    });
  });

  describe('Environment Configuration', () => {
    it('should have .env.example file for documentation', () => {
      const envExamplePath = resolve(rootDir, '.env.example');
      expect(existsSync(envExamplePath)).toBe(true);
    });

    it('should document all required bot environment variables in .env.example', () => {
      const envExamplePath = resolve(rootDir, '.env.example');
      const envExample = readFileSync(envExamplePath, 'utf-8');

      // Check for required bot environment variables
      const requiredBotVars = [
        'DISCORD_BOT_TOKEN',
        'DISCORD_APPLICATION_ID',
        'DISCORD_GUILD_ID',
        'DISCORD_ADMIN_USER_ID',
        'DATABASE_URL',
        'BOT_API_KEY',
        'BOT_API_URL',
        'DEPLOYMENT_MODE',
      ];

      requiredBotVars.forEach((varName) => {
        expect(envExample).toContain(varName);
      });
    });

    it('should document all Discord channel IDs in .env.example', () => {
      const envExamplePath = resolve(rootDir, '.env.example');
      const envExample = readFileSync(envExamplePath, 'utf-8');

      // Check for Discord channel environment variables
      const channelVars = [
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

      channelVars.forEach((varName) => {
        expect(envExample).toContain(varName);
      });
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have tsconfig.bot.json for bot compilation', () => {
      const tsconfigBotPath = resolve(rootDir, 'tsconfig.bot.json');
      expect(existsSync(tsconfigBotPath)).toBe(true);
    });

    it('should configure bot compilation to output to bot/dist/', () => {
      const tsconfigBotPath = resolve(rootDir, 'tsconfig.bot.json');
      const tsconfigBot = JSON.parse(readFileSync(tsconfigBotPath, 'utf-8'));

      // Check output directory
      expect(tsconfigBot.compilerOptions).toHaveProperty('outDir');
      expect(tsconfigBot.compilerOptions.outDir).toBe('./bot/dist');
    });

    it('should include bot/ directory in compilation', () => {
      const tsconfigBotPath = resolve(rootDir, 'tsconfig.bot.json');
      const tsconfigBot = JSON.parse(readFileSync(tsconfigBotPath, 'utf-8'));

      // Check include patterns
      expect(tsconfigBot.include).toContain('bot/**/*');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should have health server implementation in bot/', () => {
      const healthServerPath = resolve(rootDir, 'bot/health-server.ts');
      expect(existsSync(healthServerPath)).toBe(true);
    });

    it('should export health server functions', () => {
      const healthServerPath = resolve(rootDir, 'bot/health-server.ts');
      const healthServer = readFileSync(healthServerPath, 'utf-8');

      // Check for exported functions (either createHealthServer or startHealthServer)
      expect(healthServer).toMatch(/export.*(createHealthServer|startHealthServer)/);
    });

    it('should respond to /health endpoint', () => {
      const healthServerPath = resolve(rootDir, 'bot/health-server.ts');
      const healthServer = readFileSync(healthServerPath, 'utf-8');

      // Check for health endpoint handler
      expect(healthServer).toMatch(/\/health/);
    });

    it('should use PORT environment variable with default 8080', () => {
      const healthServerPath = resolve(rootDir, 'bot/health-server.ts');
      const healthServer = readFileSync(healthServerPath, 'utf-8');

      // Check for PORT configuration
      expect(healthServer).toMatch(/PORT/);
      expect(healthServer).toMatch(/8080/);
    });
  });
});
