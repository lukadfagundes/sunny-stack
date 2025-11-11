/**
 * @file GitHub Monitoring API Route
 * @description Monitor GitHub workflows, pull requests, and deployments
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBotAuth } from '@/lib/middleware/auth';
import { getGitHubStatusSummary, getGitHubHealth } from '@/lib/integrations/github';
import logger from '@/lib/logger';

async function handler(req: NextRequest) {
  try {
    logger.info('Fetching GitHub status...');

    const summary = await getGitHubStatusSummary();

    return NextResponse.json({
      status: 'success',
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch GitHub status:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch GitHub status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = withBotAuth(handler);
