/**
 * @file Admin Quote Conversion API
 * @description Converts a pending quote to a project using atomic transaction
 * @route POST /api/admin/quotes/[id]/convert - Convert quote to project
 * @warning HIGH RISK - Uses transactional quote conversion from Phase 1 Group 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { convertQuoteToProject } from '@/lib/admin/quote-conversion';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';

/**
 * POST /api/admin/quotes/[id]/convert
 * Convert a PENDING quote to a project
 *
 * Uses atomic transaction from lib/admin/quote-conversion.ts
 * Transaction ensures:
 * 1. Quote exists and is PENDING
 * 2. Project is created
 * 3. Quote status updated to CONVERTED
 * 4. Quote linked to project
 *
 * All steps succeed or all fail (atomicity)
 */
export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Await params at the top of the function for use in error handlers
  const { id: quoteId } = await params;

  try {

    // Call quote conversion utility from Phase 1 Group 1
    // This handles all validation and transaction logic
    const result = await convertQuoteToProject(quoteId);

    // Log success (already logged in utility, but log API success too)
    logger.info('Quote conversion API succeeded', {
      quoteId,
      projectId: result.project.id,
    });

    // Return success response
    return NextResponse.json({
      project: result.project,
      quote: result.quote,
      message: 'Quote converted successfully',
    });
  } catch (error) {
    // Error handling and logging already done in convertQuoteToProject
    // Just map errors to appropriate HTTP responses

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          field: error.field,
        },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    // Unknown error
    logger.error('Quote conversion API failed with unknown error', {
      quoteId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to convert quote to project' },
      { status: 500 }
    );
  }
});
