/**
 * @file Admin Projects API - Single Project Operations
 * @description Handles GET, PUT, DELETE for individual projects
 * @route GET /api/admin/projects/[id] - Get project with relations
 * @route PUT /api/admin/projects/[id] - Update project
 * @route DELETE /api/admin/projects/[id] - Soft delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { ProjectStatus } from '@prisma/client';

/**
 * GET /api/admin/projects/[id]
 * Get a single project with relations (quotes, timeEntries, messages)
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Await params at the top of the function for use in error handlers
  const { id } = await params;

  try {
    // Find project with relations
    const project = await prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Exclude soft-deleted
      },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
        },
        timeEntries: {
          orderBy: { startedAt: 'desc' },
          take: 10, // Limit to 10 most recent entries
        },
        discordMessages: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Limit to 10 most recent messages
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project', id);
    }

    // Log success
    logger.info('Project retrieved', {
      projectId: id,
      title: project.title,
    });

    return NextResponse.json({ project });
  } catch (error) {
    logger.error('Failed to retrieve project', {
      projectId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

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
      { error: 'Failed to retrieve project' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/projects/[id]
 * Update a project
 *
 * Allowed fields:
 * - title: string
 * - description: string
 * - status: ProjectStatus
 * - budget: number
 * - deadline: string (ISO date)
 * - clientName: string
 * - clientEmail: string
 */
export const PUT = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Await params at the top of the function for use in error handlers
  const { id } = await params;

  try {
    const body = await req.json();

    // Check if project exists and is not soft-deleted
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingProject) {
      throw new NotFoundError('Project', id);
    }

    // Build update data object
    const updateData: any = {};

    // Validate and add allowed fields
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        throw new ValidationError('Title must be a non-empty string', 'title');
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string') {
        throw new ValidationError('Description must be a string', 'description');
      }
      updateData.description = body.description?.trim() || null;
    }

    if (body.status !== undefined) {
      if (!Object.values(ProjectStatus).includes(body.status)) {
        throw new ValidationError(
          `Invalid status. Must be one of: ${Object.values(ProjectStatus).join(', ')}`,
          'status'
        );
      }
      updateData.status = body.status;
    }

    if (body.budget !== undefined) {
      if (body.budget !== null) {
        const budgetNum = parseFloat(body.budget);
        if (isNaN(budgetNum) || budgetNum < 0) {
          throw new ValidationError(
            'Budget must be a positive number',
            'budget'
          );
        }
        updateData.budget = budgetNum;
      } else {
        updateData.budget = null;
      }
    }

    if (body.deadline !== undefined) {
      if (body.deadline !== null) {
        if (isNaN(Date.parse(body.deadline))) {
          throw new ValidationError('Invalid deadline format', 'deadline');
        }
        updateData.deadline = new Date(body.deadline);
      } else {
        updateData.deadline = null;
      }
    }

    if (body.clientName !== undefined) {
      if (typeof body.clientName !== 'string' || body.clientName.trim() === '') {
        throw new ValidationError(
          'Client name must be a non-empty string',
          'clientName'
        );
      }
      updateData.clientName = body.clientName.trim();
    }

    if (body.clientEmail !== undefined) {
      if (typeof body.clientEmail !== 'string' || body.clientEmail.trim() === '') {
        throw new ValidationError(
          'Client email must be a non-empty string',
          'clientEmail'
        );
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.clientEmail)) {
        throw new ValidationError('Invalid email format', 'clientEmail');
      }
      updateData.clientEmail = body.clientEmail.trim().toLowerCase();
    }

    // Update project in database
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Log success
    logger.info('Project updated', {
      projectId: id,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({ project });
  } catch (error) {
    logger.error('Failed to update project', {
      projectId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/projects/[id]
 * Soft delete a project (sets deletedAt timestamp)
 */
export const DELETE = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Await params at the top of the function for use in error handlers
  const { id } = await params;

  try {

    // Check if project exists and is not already deleted
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundError('Project', id);
    }

    if (existingProject.deletedAt !== null) {
      throw new ValidationError(
        'Project is already deleted',
        'deletedAt'
      );
    }

    // Soft delete: set deletedAt timestamp
    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log success
    logger.info('Project soft deleted', {
      projectId: id,
      title: existingProject.title,
    });

    return NextResponse.json({
      success: true,
      projectId: id,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete project', {
      projectId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

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
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
});
