import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import logger from '@/lib/logger';
import { AppError } from '@/lib/errors/app-error';

// Simple in-memory cache (60 second TTL)
let servicesCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

async function checkService(name: string, endpoint: string) {
  const startTime = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;
    const status = response.ok ? 'operational' : 'degraded';

    return {
      name,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      endpoint,
    };
  } catch (error) {
    return {
      name,
      status: 'down' as const,
      responseTime: null,
      lastChecked: new Date().toISOString(),
      endpoint,
    };
  }
}

export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Check cache
    const now = Date.now();
    if (servicesCache && now - servicesCache.timestamp < CACHE_TTL) {
      logger.info('Returning cached service status');
      return NextResponse.json(servicesCache.data);
    }

    // Check all services in parallel
    const services = await Promise.all([
      checkService('Vercel', 'https://api.vercel.com/v1/status'),
      checkService('GitHub', 'https://api.github.com/status'),
      checkService('Discord', 'https://discord.com/api/v10'),
      checkService('Google APIs', 'https://www.googleapis.com'),
    ]);

    const summary = {
      total: services.length,
      operational: services.filter((s) => s.status === 'operational').length,
      degraded: services.filter((s) => s.status === 'degraded').length,
      down: services.filter((s) => s.status === 'down').length,
    };

    const response = { services, summary };

    // Update cache
    servicesCache = { data: response, timestamp: now };

    logger.info('External services checked', { summary });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to check external services', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AppError('Failed to check external services', 500);
  }
});
