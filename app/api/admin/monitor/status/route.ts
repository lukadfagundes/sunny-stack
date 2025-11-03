/**
 * @file Admin Monitor Status API
 * @description Returns comprehensive system health status (bot, database, Discord)
 * @route GET /api/admin/monitor/status - Get system status
 */

import { NextResponse } from 'next/server';
import { withBotAuth, withRateLimit } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';

/**
 * Get bot metrics (uptime, version, deployment mode)
 */
function getBotMetrics() {
  const botStartTime = global.botStartTime || Date.now();
  const uptimeSeconds = Math.floor((Date.now() - botStartTime) / 1000);
  const deploymentMode = process.env.DEPLOYMENT_MODE || 'unknown';
  const version = process.env.npm_package_version || '1.0.0';

  return {
    online: true,
    uptime: uptimeSeconds,
    version,
    deploymentMode,
    commandsLoaded: global.botCommandsCount || 0,
    lastRestart: new Date(botStartTime).toISOString(),
  };
}

/**
 * Get database health metrics (connection status, response time, record counts)
 */
async function getDatabaseMetrics() {
  const dbStartTime = Date.now();

  try {
    // Quick health check query
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - dbStartTime;

    // Get record counts in parallel
    const [projects, quotes, timeEntries, users] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.quote.count({ where: { deletedAt: null } }),
      prisma.timeEntry.count(),
      prisma.user.count(),
    ]);

    return {
      connected: true,
      responseTime,
      stats: { projects, quotes, timeEntries, users },
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      connected: false,
      responseTime: 0,
      stats: { projects: 0, quotes: 0, timeEntries: 0, users: 0 },
    };
  }
}

/**
 * Get Discord API metrics (connection status, guilds, channels, latency)
 */
function getDiscordMetrics() {
  return {
    connected: global.discordClient?.isReady?.() || false,
    guilds: global.discordClient?.guilds?.cache?.size || 0,
    channels: global.discordClient?.channels?.cache?.size || 0,
    latency: global.discordClient?.ws?.ping || null,
  };
}

/**
 * GET /api/admin/monitor/status
 * Returns bot uptime, database health, and Discord connection metrics
 */
async function handler() {
  try {
    const [bot, database] = await Promise.all([
      Promise.resolve(getBotMetrics()),
      getDatabaseMetrics(),
    ]);
    const discord = getDiscordMetrics();

    return NextResponse.json({ bot, database, discord });
  } catch (error) {
    logger.error('Monitor status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (30 req/min) and bot authentication
export const GET = withRateLimit(withBotAuth(handler), { limit: 30, windowMs: 60000 });
