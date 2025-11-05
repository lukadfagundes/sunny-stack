/**
 * @file Admin Quotes API - Single Quote Operations
 * @description Handles GET and PUT for individual quotes
 * @route GET /api/admin/quotes/[id] - Get single quote
 * @route PUT /api/admin/quotes/[id] - Update quote status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { QuoteStatus } from '@prisma/client';

/**
 * GET /api/admin/quotes/[id]
 * Get a single quote by ID
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // Find quote
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundError('Quote', id);
    }

    // Log success
    logger.info('Quote retrieved', {
      quoteId: id,
      status: quote.status,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    logger.error('Failed to retrieve quote', {
      quoteId: params.id,
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
      { error: 'Failed to retrieve quote' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/quotes/[id]
 * Update quote status and reviewedAt
 *
 * Allowed fields:
 * - status: QuoteStatus
 * - reviewedAt: string (ISO date) - optional, defaults to now if status changes
 *
 * Note: Quote data (name, email, etc.) is immutable.
 * Only status and reviewedAt can be updated.
 */
export const PUT = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await req.json();

    // Check if quote exists
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      throw new NotFoundError('Quote', id);
    }

    // Build update data object
    const updateData: any = {};

    // Validate and add status
    if (body.status !== undefined) {
      if (!Object.values(QuoteStatus).includes(body.status)) {
        throw new ValidationError(
          `Invalid status. Must be one of: ${Object.values(QuoteStatus).join(', ')}`,
          'status'
        );
      }
      updateData.status = body.status;

      // Auto-set reviewedAt when status changes
      if (body.status !== existingQuote.status) {
        updateData.reviewedAt = new Date();
      }
    }

    // Allow manual reviewedAt override
    if (body.reviewedAt !== undefined) {
      if (body.reviewedAt !== null) {
        if (isNaN(Date.parse(body.reviewedAt))) {
          throw new ValidationError(
            'Invalid reviewedAt format',
            'reviewedAt'
          );
        }
        updateData.reviewedAt = new Date(body.reviewedAt);
      } else {
        updateData.reviewedAt = null;
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Update quote in database
    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Log success
    logger.info('Quote updated', {
      quoteId: id,
      updatedFields: Object.keys(updateData),
      newStatus: quote.status,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    logger.error('Failed to update quote', {
      quoteId: params.id,
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
      { error: 'Failed to update quote' },
      { status: 500 }
    );
  }
});
