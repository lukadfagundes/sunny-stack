import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors/app-error';

/**
 * POST /admin/time-entries/manual
 * Create a manual time entry with start and end times
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { projectId, description, startedAt, endedAt, durationMinutes, loggedVia } = body;

    // Validate required fields
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }
    if (!startedAt) {
      throw new ValidationError('Start time is required');
    }
    if (!endedAt) {
      throw new ValidationError('End time is required');
    }
    if (!durationMinutes || durationMinutes <= 0) {
      throw new ValidationError('Duration must be greater than 0');
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      throw new ValidationError('Project not found');
    }

    // Validate dates
    const startDate = new Date(startedAt);
    const endDate = new Date(endedAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    if (endDate <= startDate) {
      throw new ValidationError('End time must be after start time');
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        description: description || null,
        startedAt: startDate,
        endedAt: endDate,
        durationMinutes,
        loggedVia: loggedVia || 'manual',
      },
    });

    logger.info('Manual time entry created', {
      timeEntryId: timeEntry.id,
      projectId,
      durationMinutes,
      loggedVia,
    });

    return NextResponse.json({
      timeEntry: {
        id: timeEntry.id,
        projectId: timeEntry.projectId,
        description: timeEntry.description,
        startedAt: timeEntry.startedAt.toISOString(),
        endedAt: timeEntry.endedAt!.toISOString(),
        durationMinutes: timeEntry.durationMinutes!,
      },
      project: {
        id: project.id,
        title: project.title,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    logger.error('Failed to create manual time entry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AppError('Failed to create manual time entry', 500);
  }
});
