/**
 * @file PDF generator and storage logic
 * @description Generate proposals from quote data and save to database
 * @module lib/pdf/pdf-generator
 */

import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { createProposalTemplate, ProposalData } from './proposal-template';
import { Quote, Proposal } from '@prisma/client';

/**
 * Parse budget string to extract numeric value
 *
 * Handles various budget formats:
 * - "$10,000" -> 10000
 * - "10000" -> 10000
 * - "$5k-$10k" -> 7500 (average)
 * - "Under $5,000" -> 5000
 *
 * @param {string} budgetString - Budget string from quote
 * @returns {number} Parsed budget amount
 */
function parseBudgetString(budgetString: string): number {
  try {
    // Remove currency symbols and commas
    const cleaned = budgetString.replace(/[$,]/g, '');

    // Handle range format (e.g., "5000-10000" or "5k-10k")
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-');
      const min = parseFloat(parts[0].replace('k', '000'));
      const max = parseFloat(parts[1].replace('k', '000'));
      return (min + max) / 2; // Return average
    }

    // Handle "Under X" format
    if (cleaned.toLowerCase().includes('under')) {
      const match = cleaned.match(/[\d.]+/);
      return match ? parseFloat(match[0].replace('k', '000')) : 0;
    }

    // Handle "Over X" format
    if (cleaned.toLowerCase().includes('over')) {
      const match = cleaned.match(/[\d.]+/);
      return match ? parseFloat(match[0].replace('k', '000')) : 0;
    }

    // Handle simple numeric or "Xk" format
    const numericMatch = cleaned.match(/[\d.]+/);
    if (numericMatch) {
      const value = parseFloat(numericMatch[0]);
      return cleaned.toLowerCase().includes('k') ? value * 1000 : value;
    }

    return 0;
  } catch (error) {
    logger.warn('Failed to parse budget string', { budgetString, error });
    return 0;
  }
}

/**
 * Transform quote data to proposal data format
 *
 * @param {Quote} quote - Quote from database
 * @returns {ProposalData} Formatted proposal data
 */
export function transformQuoteToProposalData(quote: Quote): ProposalData {
  const budgetAmount = quote.budgetRange ? parseBudgetString(quote.budgetRange) : 0;

  return {
    clientName: quote.name,
    clientEmail: quote.email,
    projectTitle: quote.projectType || `Project for ${quote.name}`,
    projectDescription: quote.description || 'No description provided',
    timeline: quote.timeline || 'To be determined',
    budget: {
      items: [
        {
          description: 'Project Development',
          amount: budgetAmount,
        },
      ],
      total: budgetAmount,
    },
    terms:
      'Payment Terms: 50% upfront, 50% upon completion. Deliverables: Source code, documentation, and deployment. Revisions: Up to 2 rounds of revisions included. Additional revisions billed at hourly rate.',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  };
}

/**
 * Generate proposal PDF from quote data
 *
 * Creates a professional PDF proposal using the quote information.
 * Returns the PDF as a Buffer for storage or email attachment.
 *
 * @param {ProposalData} data - Proposal data
 * @returns {Promise<Buffer>} PDF as Buffer
 *
 * @example
 * const data = transformQuoteToProposalData(quote);
 * const pdfBuffer = await generateProposalPDF(data);
 * // Use pdfBuffer for storage or email
 */
export async function generateProposalPDF(data: ProposalData): Promise<Buffer> {
  try {
    logger.info('Generating proposal PDF', {
      clientName: data.clientName,
      projectTitle: data.projectTitle,
    });

    // Create PDF using template
    const doc = createProposalTemplate(data);

    // Convert to ArrayBuffer then to Buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    logger.info('Proposal PDF generated successfully', {
      sizeBytes: pdfBuffer.length,
    });

    return pdfBuffer;
  } catch (error) {
    logger.error('Failed to generate proposal PDF', {
      clientName: data.clientName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Save proposal to database
 *
 * Stores the proposal record with PDF content. The PDF is stored as a base64
 * data URL for simplicity. For production use, consider storing in cloud storage
 * (S3, Cloudflare R2, etc.) and saving only the URL.
 *
 * @param {string} quoteId - Quote ID
 * @param {string} projectId - Project ID
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<Proposal>} Created proposal record
 * @throws {NotFoundError} If quote is not found
 *
 * @example
 * const proposal = await saveProposalToDatabase(
 *   'quote_123',
 *   'project_456',
 *   pdfBuffer
 * );
 * console.log('Proposal saved:', proposal.id);
 */
export async function saveProposalToDatabase(
  quoteId: string,
  projectId: string,
  pdfBuffer: Buffer
): Promise<Proposal> {
  try {
    logger.info('Saving proposal to database', { quoteId, projectId });

    // Verify quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundError('Quote', quoteId);
    }

    // Convert PDF buffer to base64 data URL
    const base64Pdf = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${base64Pdf}`;

    // Create proposal record
    const proposal = await prisma.proposal.create({
      data: {
        quoteId,
        projectId,
        pdfUrl: pdfDataUrl,
        sentAt: null, // Will be set when email is sent
      },
    });

    logger.info('Proposal saved successfully', {
      proposalId: proposal.id,
      quoteId,
      projectId,
    });

    return proposal;
  } catch (error) {
    logger.error('Failed to save proposal to database', {
      quoteId,
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Generate and save proposal from quote
 *
 * Complete workflow:
 * 1. Fetch quote data
 * 2. Transform to proposal data
 * 3. Generate PDF
 * 4. Save to database
 *
 * @param {string} quoteId - Quote ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Proposal>} Created proposal
 * @throws {NotFoundError} If quote is not found
 *
 * @example
 * const proposal = await generateAndSaveProposal('quote_123', 'project_456');
 */
export async function generateAndSaveProposal(
  quoteId: string,
  projectId: string
): Promise<Proposal> {
  try {
    logger.info('Starting proposal generation workflow', { quoteId, projectId });

    // Step 1: Fetch quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundError('Quote', quoteId);
    }

    // Step 2: Transform quote to proposal data
    const proposalData = transformQuoteToProposalData(quote);

    // Step 3: Generate PDF
    const pdfBuffer = await generateProposalPDF(proposalData);

    // Step 4: Save to database
    const proposal = await saveProposalToDatabase(quoteId, projectId, pdfBuffer);

    logger.info('Proposal generation workflow completed', {
      proposalId: proposal.id,
      quoteId,
      projectId,
    });

    return proposal;
  } catch (error) {
    logger.error('Proposal generation workflow failed', {
      quoteId,
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
