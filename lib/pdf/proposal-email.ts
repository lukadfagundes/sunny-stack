/**
 * @file Proposal email integration with Resend API
 * @description Send generated proposals via email with PDF attachment
 * @module lib/pdf/proposal-email
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import logger from '@/lib/logger';
import { Proposal } from '@prisma/client';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email template configuration
 */
const EMAIL_CONFIG = {
  from: 'Sunny Stack <proposals@sunny-stack.com>',
  replyTo: 'luka@sunny-stack.com',
  subject: 'Your Project Proposal from Sunny Stack',
};

/**
 * Generate HTML email body for proposal
 *
 * @param {string} clientName - Client name
 * @param {string} projectTitle - Project title
 * @returns {string} HTML email content
 */
function generateEmailHTML(clientName: string, projectTitle: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Project Proposal</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff9900 0%, #ff6600 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SUNNY STACK</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Professional Web Development</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${clientName},</h2>

    <p>Thank you for your interest in working with Sunny Stack! I'm excited to share the project proposal for <strong>${projectTitle}</strong>.</p>

    <p>Please find the attached PDF proposal, which includes:</p>

    <ul style="padding-left: 20px;">
      <li>Project overview and scope</li>
      <li>Timeline and deliverables</li>
      <li>Budget breakdown</li>
      <li>Terms and conditions</li>
    </ul>

    <p>I've carefully reviewed your requirements and tailored this proposal to meet your specific needs. If you have any questions or would like to discuss any aspect of the proposal, please don't hesitate to reach out.</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #ff9900; margin: 30px 0;">
      <p style="margin: 0; font-weight: bold; color: #ff9900;">Next Steps:</p>
      <ol style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Review the attached proposal</li>
        <li>Let me know if you have any questions</li>
        <li>Sign and return if you'd like to proceed</li>
      </ol>
    </div>

    <p>I'm looking forward to the possibility of working together on this project!</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>Luka Fagundes</strong><br>
      Full Stack Developer<br>
      Sunny Stack
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <div style="font-size: 12px; color: #666; text-align: center;">
      <p style="margin: 5px 0;">
        <a href="https://sunny-stack.com" style="color: #ff9900; text-decoration: none;">sunny-stack.com</a> |
        <a href="mailto:luka@sunny-stack.com" style="color: #ff9900; text-decoration: none;">luka@sunny-stack.com</a>
      </p>
      <p style="margin: 5px 0;">This proposal is valid for 30 days from the date of issue.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email body for proposal (fallback)
 *
 * @param {string} clientName - Client name
 * @param {string} projectTitle - Project title
 * @returns {string} Plain text email content
 */
function generateEmailText(clientName: string, projectTitle: string): string {
  return `
Hi ${clientName},

Thank you for your interest in working with Sunny Stack! I'm excited to share the project proposal for ${projectTitle}.

Please find the attached PDF proposal, which includes:
- Project overview and scope
- Timeline and deliverables
- Budget breakdown
- Terms and conditions

I've carefully reviewed your requirements and tailored this proposal to meet your specific needs. If you have any questions or would like to discuss any aspect of the proposal, please don't hesitate to reach out.

NEXT STEPS:
1. Review the attached proposal
2. Let me know if you have any questions
3. Sign and return if you'd like to proceed

I'm looking forward to the possibility of working together on this project!

Best regards,
Luka Fagundes
Full Stack Developer
Sunny Stack

---
sunny-stack.com | luka@sunny-stack.com
This proposal is valid for 30 days from the date of issue.
  `.trim();
}

/**
 * Send proposal email with PDF attachment
 *
 * Fetches proposal from database, extracts PDF, and sends via Resend API.
 * Updates proposal.sentAt timestamp upon successful delivery.
 *
 * @param {string} proposalId - Proposal ID
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<void>}
 * @throws {NotFoundError} If proposal not found
 * @throws {ValidationError} If RESEND_API_KEY is missing
 * @throws {Error} If email sending fails
 *
 * @example
 * try {
 *   await sendProposalEmail('proposal_123', 'client@example.com');
 *   console.log('Proposal sent successfully');
 * } catch (error) {
 *   console.error('Failed to send proposal:', error);
 * }
 */
export async function sendProposalEmail(
  proposalId: string,
  recipientEmail: string
): Promise<void> {
  try {
    logger.info('Preparing to send proposal email', {
      proposalId,
      recipientEmail,
    });

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      throw new ValidationError('RESEND_API_KEY environment variable is not set', 'api_key');
    }

    // Fetch proposal with related quote data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        quote: true,
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal', proposalId);
    }

    if (!proposal.quote) {
      throw new ValidationError('Proposal has no associated quote', 'quote');
    }

    // Extract PDF from data URL
    if (!proposal.pdfUrl.startsWith('data:application/pdf;base64,')) {
      throw new ValidationError('Invalid PDF data URL format', 'pdfUrl');
    }

    const base64Pdf = proposal.pdfUrl.replace('data:application/pdf;base64,', '');

    // Generate email content
    const clientName = proposal.quote.name;
    const projectTitle = proposal.quote.projectType || `Project for ${clientName}`;
    const htmlContent = generateEmailHTML(clientName, projectTitle);
    const textContent = generateEmailText(clientName, projectTitle);

    // Send email via Resend
    logger.info('Sending email via Resend', {
      proposalId,
      recipientEmail,
      from: EMAIL_CONFIG.from,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: recipientEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: EMAIL_CONFIG.subject,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: `proposal-${proposalId}.pdf`,
          content: base64Pdf,
        },
      ],
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    logger.info('Email sent successfully', {
      proposalId,
      recipientEmail,
      emailId: data?.id,
    });

    // Update proposal sentAt timestamp
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { sentAt: new Date() },
    });

    logger.info('Proposal sentAt timestamp updated', { proposalId });
  } catch (error) {
    logger.error('Failed to send proposal email', {
      proposalId,
      recipientEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Resend proposal email (if already sent)
 *
 * Allows resending a proposal email that was previously sent.
 * Useful for cases where client requests a new copy.
 *
 * @param {string} proposalId - Proposal ID
 * @param {string} recipientEmail - Recipient email address (optional, defaults to quote email)
 * @returns {Promise<void>}
 * @throws {NotFoundError} If proposal not found
 *
 * @example
 * await resendProposalEmail('proposal_123');
 * // Resends to the quote's email address
 *
 * await resendProposalEmail('proposal_123', 'alternative@example.com');
 * // Resends to alternative email
 */
export async function resendProposalEmail(
  proposalId: string,
  recipientEmail?: string
): Promise<void> {
  try {
    logger.info('Resending proposal email', { proposalId, recipientEmail });

    // Fetch proposal to get default email if not provided
    if (!recipientEmail) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: { quote: true },
      });

      if (!proposal?.quote) {
        throw new NotFoundError('Proposal or associated quote', proposalId);
      }

      recipientEmail = proposal.quote.email;
    }

    // Use the main send function
    await sendProposalEmail(proposalId, recipientEmail);

    logger.info('Proposal resent successfully', { proposalId, recipientEmail });
  } catch (error) {
    logger.error('Failed to resend proposal email', {
      proposalId,
      recipientEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
