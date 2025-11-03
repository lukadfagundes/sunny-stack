/**
 * @file Admin Time Entry Stop API
 * @description Handles stopping an active time entry
 * @route POST /api/admin/time-entries/[id]/stop - Stop active timer
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBotAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';

/**
 * POST /api/admin/time-entries/[id]/stop
 * Stop an active time entry and calculate duration
 *
 * URL params:
 * - id: string (time entry ID)
 *
 * Request body: {} (empty)
 *
 * Validation:
 * - Time entry must exist
 * - Time entry must NOT already be stopped (endedAt must be null)
 * - Calculate durationMinutes = Math.round((endedAt - startedAt) / 60000)
 */
export const POST = withBotAuth(
  async (req: NextRequest, context?: { params: any }) => {
    try {
      // Extract ID from route params
      const params = await context?.params;
      const { id } = params || {};

      if (!id || typeof id !== 'string') {
        throw new ValidationError('Time entry ID is required', 'id');
      }

      // Find time entry
      const timeEntry = await prisma.timeEntry.findUnique({
        where: { id },
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
            },
          },
        },
      });

      if (!timeEntry) {
        throw new NotFoundError('TimeEntry', id);
      }

      // Check if timer is already stopped
      if (timeEntry.endedAt) {
        return NextResponse.json(
          {
            error: 'Timer already stopped',
            timeEntry: {
              id: timeEntry.id,
              endedAt: timeEntry.endedAt.toISOString(),
              durationMinutes: timeEntry.durationMinutes,
            },
          },
          { status: 409 }
        );
      }

      // Calculate duration in minutes
      const endedAt = new Date();
      const durationMs = endedAt.getTime() - timeEntry.startedAt.getTime();
      const durationMinutes = Math.round(durationMs / 60000); // Convert ms to minutes

      // Update time entry with endedAt and duration
      const updatedTimeEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          endedAt,
          durationMinutes,
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
      logger.info('Time entry stopped', {
        timeEntryId: updatedTimeEntry.id,
        projectId: updatedTimeEntry.projectId,
        durationMinutes: updatedTimeEntry.durationMinutes,
      });

      // Return updated time entry with project info
      return NextResponse.json({
        timeEntry: updatedTimeEntry,
        project: {
          id: timeEntry.project.id,
          title: timeEntry.project.title,
        },
      });
    } catch (error) {
      logger.error('Failed to stop time entry', {
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
        { error: 'Failed to stop time entry' },
        { status: 500 }
      );
    }
  }
);
