/**
 * @file Admin Time Entries API - Start Timer and List Entries
 * @description Handles POST (start timer) and GET (list entries) for time tracking
 * @route POST /api/admin/time-entries - Start new time entry
 * @route GET /api/admin/time-entries - List time entries with pagination/filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBotAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';

/**
 * POST /api/admin/time-entries
 * Start a new time tracking entry
 *
 * Required fields:
 * - projectId: string (UUID)
 *
 * Optional fields:
 * - description: string (max 500 chars)
 * - loggedVia: 'discord' | 'web' | 'api' (default: 'discord')
 *
 * Validation:
 * - Project must exist
 * - Only one active timer allowed (no endedAt)
 * - Description max 500 characters
 */
export const POST = withBotAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate required fields
    const { projectId } = body;

    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      throw new ValidationError('Project ID is required', 'projectId');
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        deletedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    if (project.deletedAt) {
      throw new ValidationError(
        'Cannot start timer for deleted project',
        'projectId'
      );
    }

    // Check for active timer (no endedAt)
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        projectId,
        endedAt: null,
      },
    });

    if (activeTimer) {
      return NextResponse.json(
        {
          error: 'Active timer already exists for this project',
          activeTimerId: activeTimer.id,
        },
        { status: 409 }
      );
    }

    // Validate optional fields
    const { description, loggedVia } = body;

    if (description && typeof description !== 'string') {
      throw new ValidationError('Description must be a string', 'description');
    }

    if (description && description.length > 500) {
      throw new ValidationError(
        'Description must be 500 characters or less',
        'description'
      );
    }

    const validLoggedVia = ['discord', 'web', 'api'];
    if (loggedVia && !validLoggedVia.includes(loggedVia)) {
      throw new ValidationError(
        `loggedVia must be one of: ${validLoggedVia.join(', ')}`,
        'loggedVia'
      );
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        description: description?.trim() || null,
        loggedVia: loggedVia || 'discord',
        startedAt: new Date(),
      },
      select: {
        id: true,
        projectId: true,
        description: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        loggedVia: true,
      },
    });

    // Log success
    logger.info('Time entry started', {
      timeEntryId: timeEntry.id,
      projectId: timeEntry.projectId,
      loggedVia: timeEntry.loggedVia,
    });

    // Return created time entry with project info (201 Created)
    return NextResponse.json(
      {
        timeEntry,
        project: {
          id: project.id,
          title: project.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to start time entry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start time entry' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/admin/time-entries
 * List time entries with pagination, filtering, and sorting
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - projectId: string (optional filter)
 * - status: 'active' | 'completed' | 'all' (default: 'all')
 */
export const GET = withBotAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status') || 'all';

    // Validate pagination
    if (page < 1 || limit < 1) {
      throw new ValidationError('Page and limit must be positive numbers');
    }

    // Validate status filter
    const validStatuses = ['active', 'completed', 'all'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        'status'
      );
    }

    // Build where clause
    const where: any = {};

    // Filter by project
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by status
    if (status === 'active') {
      where.endedAt = null;
    } else if (status === 'completed') {
      where.endedAt = { not: null };
    }
    // 'all' = no filter on endedAt

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Query database with Prisma
    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          projectId: true,
          description: true,
          startedAt: true,
          endedAt: true,
          durationMinutes: true,
          loggedVia: true,
          project: {
            select: {
              id: true,
              title: true,
              clientName: true,
            },
          },
        },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    // Log success
    logger.info('Time entries list retrieved', {
      page,
      limit,
      total,
      projectId,
      status,
    });

    // Return paginated response
    return NextResponse.json({
      timeEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve time entries list', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve time entries' },
      { status: 500 }
    );
  }
});
