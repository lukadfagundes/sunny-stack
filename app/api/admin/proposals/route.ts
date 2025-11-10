/**
 * @file Admin Proposal Generation API Route
 * @description API endpoint for generating and sending project proposals
 * @route POST /api/admin/proposals
 * @module app/api/admin/proposals/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminRouteProtection } from '@/lib/middleware/admin-auth';
import { handleErrorResponse } from '@/lib/errors/handler';
import { NotFoundError, ValidationError, AppError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { generateAndSaveProposal } from '@/lib/pdf/pdf-generator';
import { sendProposalEmail, resendProposalEmail } from '@/lib/pdf/proposal-email';

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/proposals
 *
 * Generate a proposal PDF from a quote and optionally send via email.
 *
 * Request Body:
 * ```json
 * {
 *   "quoteId": "quote_123",
 *   "sendEmail": true  // Optional, defaults to false
 * }
 * ```
 *
 * Response Success (201):
 * ```json
 * {
 *   "success": true,
 *   "proposal": {
 *     "id": "proposal_456",
 *     "quoteId": "quote_123",
 *     "projectId": "project_789",
 *     "pdfUrl": "data:application/pdf;base64,...",
 *     "sentAt": "2025-10-29T12:00:00Z",
 *     "createdAt": "2025-10-29T12:00:00Z",
 *     "updatedAt": "2025-10-29T12:00:00Z"
 *   },
 *   "emailSent": true
 * }
 * ```
 *
 * Response Error (400, 404, 500):
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Quote not found: quote_123",
 *     "statusCode": 404,
 *     "name": "NotFoundError"
 *   }
 * }
 * ```
 *
 * @example
 * // Generate proposal without sending email
 * POST /api/admin/proposals
 * { "quoteId": "quote_123" }
 *
 * // Generate proposal and send email
 * POST /api/admin/proposals
 * { "quoteId": "quote_123", "sendEmail": true }
 */
export const POST = adminRouteProtection(async (req: NextRequest) => {
  try {
    logger.info('Proposal generation request received');

    // Parse and validate request body
    const body = await req.json();
    const { quoteId, sendEmail = false } = body;

    if (!quoteId) {
      throw new ValidationError('quoteId is required', 'quoteId');
    }

    if (typeof quoteId !== 'string') {
      throw new ValidationError('quoteId must be a string', 'quoteId');
    }

    // Validate quote exists and has a project
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true, projectId: true, email: true, name: true },
    });

    if (!quote) {
      throw new NotFoundError('Quote', quoteId);
    }

    if (!quote.projectId) {
      throw new ValidationError(
        'Quote must be converted to a project before generating proposal',
        'projectId'
      );
    }

    logger.info('Generating proposal', { quoteId, projectId: quote.projectId });

    // Generate and save proposal
    const proposal = await generateAndSaveProposal(quoteId, quote.projectId);

    logger.info('Proposal generated successfully', {
      proposalId: proposal.id,
      quoteId,
      projectId: quote.projectId,
    });

    // Send email if requested
    let emailSent = false;
    if (sendEmail) {
      try {
        logger.info('Sending proposal email', {
          proposalId: proposal.id,
          recipientEmail: quote.email,
        });

        await sendProposalEmail(proposal.id, quote.email);
        emailSent = true;

        logger.info('Proposal email sent successfully', {
          proposalId: proposal.id,
          recipientEmail: quote.email,
        });
      } catch (emailError) {
        // Log email error but don't fail the entire request
        logger.error('Failed to send proposal email', {
          proposalId: proposal.id,
          recipientEmail: quote.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });

        // Return partial success with email error
        return NextResponse.json(
          {
            success: true,
            proposal,
            emailSent: false,
            emailError: emailError instanceof Error ? emailError.message : 'Failed to send email',
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        proposal,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Proposal generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const { status, body } = handleErrorResponse(error);
    return NextResponse.json(body, { status });
  }
});

/**
 * GET /api/admin/proposals?quoteId=quote_123
 *
 * Get all proposals for a specific quote.
 *
 * Query Parameters:
 * - quoteId: Quote ID (required)
 *
 * Response Success (200):
 * ```json
 * {
 *   "success": true,
 *   "proposals": [
 *     {
 *       "id": "proposal_456",
 *       "quoteId": "quote_123",
 *       "projectId": "project_789",
 *       "sentAt": "2025-10-29T12:00:00Z",
 *       "createdAt": "2025-10-29T12:00:00Z"
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * GET /api/admin/proposals?quoteId=quote_123
 */
export const GET = adminRouteProtection(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const quoteId = searchParams.get('quoteId');

    if (!quoteId) {
      throw new ValidationError('quoteId query parameter is required', 'quoteId');
    }

    logger.info('Fetching proposals for quote', { quoteId });

    // Fetch proposals
    const proposals = await prisma.proposal.findMany({
      where: { quoteId },
      select: {
        id: true,
        quoteId: true,
        projectId: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
        // Don't return pdfUrl in list view (too large)
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info('Proposals fetched successfully', {
      quoteId,
      count: proposals.length,
    });

    return NextResponse.json({
      success: true,
      proposals,
    });
  } catch (error) {
    logger.error('Failed to fetch proposals', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const { status, body } = handleErrorResponse(error);
    return NextResponse.json(body, { status });
  }
});

/**
 * PUT /api/admin/proposals/resend
 *
 * Resend a proposal email.
 *
 * Request Body:
 * ```json
 * {
 *   "proposalId": "proposal_456",
 *   "recipientEmail": "client@example.com"  // Optional, defaults to quote email
 * }
 * ```
 *
 * Response Success (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "Proposal email resent successfully"
 * }
 * ```
 *
 * @example
 * PUT /api/admin/proposals/resend
 * { "proposalId": "proposal_456" }
 */
export const PUT = adminRouteProtection(async (req: NextRequest) => {
  try {
    logger.info('Proposal resend request received');

    // Parse request body
    const body = await req.json();
    const { proposalId, recipientEmail } = body;

    if (!proposalId) {
      throw new ValidationError('proposalId is required', 'proposalId');
    }

    // Validate proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { quote: true },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal', proposalId);
    }

    logger.info('Resending proposal email', {
      proposalId,
      recipientEmail: recipientEmail || proposal.quote.email,
    });

    // Resend email
    await resendProposalEmail(proposalId, recipientEmail);

    logger.info('Proposal email resent successfully', {
      proposalId,
      recipientEmail: recipientEmail || proposal.quote.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Proposal email resent successfully',
    });
  } catch (error) {
    logger.error('Failed to resend proposal email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const { status, body } = handleErrorResponse(error);
    return NextResponse.json(body, { status });
  }
});
