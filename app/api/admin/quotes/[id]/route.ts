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
import { Resend } from 'resend';

/**
 * GET /api/admin/quotes/[id]
 * Get a single quote by ID
 */
export const GET = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Await params at the top of the function for use in error handlers
  const { id } = await params;

  try {

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

    // Transform quote data to match frontend expectations
    const transformedQuote = {
      ...quote,
      contactName: quote.name,
      contactEmail: quote.email,
      contactPhone: quote.phone,
      budget: quote.budgetRange,
      // Parse requirements back into features array if it was stored as newline-separated
      features: quote.requirements ? quote.requirements.split('\n').filter(Boolean) : [],
    };

    // Log success
    logger.info('Quote retrieved', {
      quoteId: id,
      status: quote.status,
    });

    return NextResponse.json({ quote: transformedQuote });
  } catch (error) {
    logger.error('Failed to retrieve quote', {
      quoteId: id,
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
 * Shared update function for PUT and PATCH
 * Update quote status and reviewedAt
 *
 * Allowed fields:
 * - status: QuoteStatus
 * - reviewedAt: string (ISO date) - optional, defaults to now if status changes
 *
 * Note: Quote data (name, email, etc.) is immutable.
 * Only status and reviewedAt can be updated.
 */
async function updateQuote(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params at the top of the function for use in error handlers
  const { id } = await params;

  try {
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

    // Send email notification if quote was declined
    if (updateData.status === QuoteStatus.DECLINED && quote.email) {
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);

          await resend.emails.send({
            from: 'Sunny Stack <noreply@sunny-stack.com>',
            to: [quote.email],
            subject: 'Update on Your Project Quote Request',
            html: `
              <h2>Thank you for your interest in Sunny Stack</h2>

              <p>Dear ${quote.name},</p>

              <p>Thank you for reaching out to us regarding your project.

              <p>After careful review, we've determined that we won't be able to take on this project at this time. This decision is based on our current capacity and project commitments.</p>

              <p>We appreciate you considering Sunny Stack for your project and wish you the very best of luck in finding the right partner to bring your vision to life.</p>

              <p>If you have any questions or would like to discuss future opportunities, please don't hesitate to reach out.</p>

              <p>Best regards,<br>
              Luka D Fagundes<br>
              Sunny Stack<br>
              <a href="mailto:luka@sunny-stack.com">luka@sunny-stack.com</a></p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                This is an automated notification from Sunny Stack. If you believe you received this in error, please contact us at luka@sunny-stack.com
              </p>
            `,
          });

          logger.info('Decline notification email sent', {
            quoteId: id,
            recipientEmail: quote.email,
          });
        }
      } catch (emailError) {
        // Log email error but don't fail the request
        logger.error('Failed to send decline notification email', {
          quoteId: id,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
        // Continue anyway - quote status is updated even if email fails
      }
    }

    // Log success
    logger.info('Quote updated', {
      quoteId: id,
      updatedFields: Object.keys(updateData),
      newStatus: quote.status,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    logger.error('Failed to update quote', {
      quoteId: id,
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
}

// Export both PUT and PATCH using the same updateQuote function
export const PUT = withAuth(updateQuote);
export const PATCH = withAuth(updateQuote);
