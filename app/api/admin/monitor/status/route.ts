import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { AppError } from '@/lib/errors/app-error';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const startTime = Date.now();

    // Get database stats
    const [projects, quotes, timeEntries, users] = await Promise.all([
      prisma.project.count(),
      prisma.quote.count(),
      prisma.timeEntry.count(),
      prisma.user.count(),
    ]);

    const dbResponseTime = Date.now() - startTime;

    // Read version from package.json
    const pkg = require('@/package.json');

    const response = {
      bot: {
        online: true,
        uptime: process.uptime(),
        version: pkg.version,
        deploymentMode: process.env.DEPLOYMENT_MODE || 'unknown',
        commandsLoaded: 18, // Will be dynamic in Phase 3
        lastRestart: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
      database: {
        connected: true,
        responseTime: dbResponseTime,
        stats: { projects, quotes, timeEntries, users },
      },
      discord: {
        connected: true, // Placeholder for Phase 3
        guilds: 1, // Placeholder
        channels: 13, // Placeholder
        latency: null,
      },
    };

    logger.info('Monitor status retrieved', { responseTime: dbResponseTime });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get monitor status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AppError('Failed to retrieve monitor status', 500);
  }
});
