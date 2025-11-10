/**
 * @file Admin Projects API - List and Create
 * @description Handles GET (list) and POST (create) for admin projects
 * @route GET /api/admin/projects - List projects with pagination/filtering/sorting
 * @route POST /api/admin/projects - Create new project
 * @auth Supports both NextAuth session and Bot API key authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { ProjectStatus } from '@prisma/client';

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/projects
 * List all projects with pagination, filtering, and sorting
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - status: ProjectStatus (optional filter)
 * - title: string (optional filter - case-insensitive search)
 * - exact: boolean (default: false - use exact match for title)
 * - sort: string (default: 'createdAt')
 * - order: 'asc' | 'desc' (default: 'desc')
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );
    const status = searchParams.get('status') as ProjectStatus | null;
    const title = searchParams.get('title') || null;
    const exact = searchParams.get('exact') === 'true';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Validate pagination
    if (page < 1 || limit < 1) {
      throw new ValidationError('Page and limit must be positive numbers');
    }

    // Validate sort field
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'status',
      'deadline',
      'clientName',
    ];
    if (!validSortFields.includes(sort)) {
      throw new ValidationError(
        `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`
      );
    }

    // Validate status filter
    if (status && !Object.values(ProjectStatus).includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${Object.values(ProjectStatus).join(', ')}`
      );
    }

    // Build where clause
    const where: any = {
      deletedAt: null, // Exclude soft-deleted projects
    };

    if (status) {
      where.status = status;
    }

    // Add title filter (case-insensitive search)
    if (title) {
      if (exact) {
        where.title = { equals: title, mode: 'insensitive' };
      } else {
        where.title = { contains: title, mode: 'insensitive' };
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Query database with Prisma
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          clientName: true,
          clientEmail: true,
          status: true,
          budget: true,
          deadline: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              quotes: true,
              timeEntries: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Log success
    logger.info('Projects list retrieved', {
      page,
      limit,
      total,
      status,
      sort,
      order,
    });

    // Return paginated response
    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve projects list', {
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
      { error: 'Failed to retrieve projects' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/projects
 * Create a new project
 *
 * Required fields:
 * - title: string
 * - clientName: string
 * - clientEmail: string
 *
 * Optional fields:
 * - description: string
 * - status: ProjectStatus (default: PLANNING)
 * - budget: number
 * - deadline: string (ISO date)
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate required fields
    const { title, clientName, clientEmail } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ValidationError('Title is required', 'title');
    }

    if (
      !clientName ||
      typeof clientName !== 'string' ||
      clientName.trim() === ''
    ) {
      throw new ValidationError('Client name is required', 'clientName');
    }

    if (
      !clientEmail ||
      typeof clientEmail !== 'string' ||
      clientEmail.trim() === ''
    ) {
      throw new ValidationError('Client email is required', 'clientEmail');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      throw new ValidationError('Invalid email format', 'clientEmail');
    }

    // Validate optional fields
    const { description, status, budget, deadline } = body;

    if (status && !Object.values(ProjectStatus).includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${Object.values(ProjectStatus).join(', ')}`,
        'status'
      );
    }

    if (budget !== undefined && budget !== null) {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        throw new ValidationError(
          'Budget must be a positive number',
          'budget'
        );
      }
    }

    if (deadline && isNaN(Date.parse(deadline))) {
      throw new ValidationError('Invalid deadline format', 'deadline');
    }

    // Create project in database
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        description: description?.trim() || null,
        status: status || ProjectStatus.PLANNING,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    // Log success
    logger.info('Project created', {
      projectId: project.id,
      title: project.title,
      clientEmail: project.clientEmail,
    });

    // Return created project with 201 status
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create project', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

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
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
});
