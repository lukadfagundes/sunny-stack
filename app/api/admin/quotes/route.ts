/**
 * @file Admin Quotes API - List Quotes
 * @description Handles GET (list) for admin quotes
 * @route GET /api/admin/quotes - List quotes with pagination/filtering/sorting
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { QuoteStatus } from '@prisma/client';

/**
 * GET /api/admin/quotes
 * List all quotes with pagination, filtering, and sorting
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - status: QuoteStatus (optional filter)
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
    const status = searchParams.get('status') as QuoteStatus | null;
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
      'name',
      'email',
      'status',
      'reviewedAt',
    ];
    if (!validSortFields.includes(sort)) {
      throw new ValidationError(
        `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`
      );
    }

    // Validate status filter
    if (status && !Object.values(QuoteStatus).includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${Object.values(QuoteStatus).join(', ')}`
      );
    }

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Query database with Prisma
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    // Log success
    logger.info('Quotes list retrieved', {
      page,
      limit,
      total,
      status,
      sort,
      order,
    });

    // Return paginated response
    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve quotes list', {
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
      { error: 'Failed to retrieve quotes' },
      { status: 500 }
    );
  }
});
