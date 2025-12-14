/**
 * @file Quote conversion transaction logic
 * @description Atomic quote-to-project conversion with full Prisma transaction support
 * @module lib/admin/quote-conversion
 */

import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { Project, Quote, QuoteStatus, ProjectStatus } from '@prisma/client';

/**
 * Quote conversion result
 */
export interface QuoteConversionResult {
  project: Project;
  quote: Quote;
}

/**
 * Convert a quote to a project using atomic transaction
 *
 * This function performs the following operations atomically:
 * 1. Validates quote exists and has PENDING status
 * 2. Creates a new project from quote data
 * 3. Updates quote status to CONVERTED and links to project
 * 4. Logs the conversion
 *
 * All operations are wrapped in a Prisma transaction to ensure atomicity.
 * If any step fails, the entire transaction is rolled back.
 *
 * @param {string} quoteId - ID of the quote to convert
 * @returns {Promise<QuoteConversionResult>} Converted project and updated quote
 * @throws {NotFoundError} If quote with given ID is not found
 * @throws {ValidationError} If quote status is not PENDING
 *
 * @example
 * try {
 *   const result = await convertQuoteToProject('quote_123');
 *   console.log('Project created:', result.project.id);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Quote already converted');
 *   }
 * }
 */
export async function convertQuoteToProject(
  quoteId: string
): Promise<QuoteConversionResult> {
  try {
    logger.info('Starting quote conversion', { quoteId });

    // Use Prisma $transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Validate quote exists
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
      });

      if (!quote) {
        throw new NotFoundError('Quote', quoteId);
      }

      // Step 2: Validate quote status is PENDING or APPROVED
      if (quote.status !== QuoteStatus.PENDING && quote.status !== QuoteStatus.APPROVED) {
        throw new ValidationError(
          `Quote cannot be converted. Current status: ${quote.status}. Only PENDING or APPROVED quotes can be converted.`,
          'status'
        );
      }

      // Step 3: Create project from quote data
      const project = await tx.project.create({
        data: {
          title: quote.projectType,
          description: quote.description,
          clientName: quote.name,
          clientEmail: quote.email,
          status: ProjectStatus.PLANNING,
          // Note: budgetRange and timeline from quote are stored as strings
          // Project.budget is Decimal and deadline is DateTime
          // These will need to be parsed/converted by admin when reviewing
        },
      });

      // Step 4: Update quote status to CONVERTED and link to project
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.CONVERTED,
          projectId: project.id,
          reviewedAt: new Date(),
        },
      });

      return { project, quote: updatedQuote };
    });

    // Log success after transaction commits
    logger.info('Quote converted successfully', {
      quoteId,
      projectId: result.project.id,
    });

    return result;
  } catch (error) {
    // Log error before re-throwing
    logger.error('Quote conversion failed', {
      quoteId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Validate if a quote can be converted
 *
 * Checks if quote exists and has PENDING status without modifying data.
 * Useful for UI validation before attempting conversion.
 *
 * @param {string} quoteId - ID of the quote to validate
 * @returns {Promise<boolean>} True if quote can be converted
 *
 * @example
 * const canConvert = await canConvertQuote('quote_123');
 * if (canConvert) {
 *   // Show convert button
 * }
 */
export async function canConvertQuote(quoteId: string): Promise<boolean> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true },
    });

    return quote?.status === QuoteStatus.PENDING || quote?.status === QuoteStatus.APPROVED;
  } catch (error) {
    logger.error('Error checking quote conversion eligibility', {
      quoteId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
