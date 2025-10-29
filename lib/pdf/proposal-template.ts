/**
 * @file Professional proposal PDF template using jspdf
 * @description Multi-page proposal template with company branding
 * @module lib/pdf/proposal-template
 */

import jsPDF from 'jspdf';

/**
 * Proposal data interface
 */
export interface ProposalData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectDescription: string;
  timeline: string;
  budget: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  terms: string;
  validUntil: Date;
}

/**
 * Template configuration
 */
const TEMPLATE_CONFIG = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 20,
  lineHeight: 6,
  colors: {
    primary: [255, 153, 0] as [number, number, number], // Sunny Stack orange
    secondary: [60, 60, 60] as [number, number, number], // Dark gray
    text: [0, 0, 0] as [number, number, number], // Black
    lightGray: [200, 200, 200] as [number, number, number],
  },
  fonts: {
    title: 24,
    heading: 16,
    subheading: 12,
    body: 10,
    small: 8,
  },
};

/**
 * Create a professional proposal PDF
 *
 * Generates multi-page PDF with:
 * - Cover page with branding
 * - Client details
 * - Project scope
 * - Timeline
 * - Budget breakdown
 * - Terms & conditions
 * - Signature section
 * - Footer on all pages
 *
 * @param {ProposalData} data - Proposal data
 * @returns {jsPDF} jsPDF document instance
 *
 * @example
 * const doc = createProposalTemplate({
 *   clientName: 'John Doe',
 *   clientEmail: 'john@example.com',
 *   projectTitle: 'E-commerce Website',
 *   projectDescription: 'Build a modern e-commerce platform',
 *   timeline: '3 months',
 *   budget: {
 *     items: [{ description: 'Development', amount: 10000 }],
 *     total: 10000
 *   },
 *   terms: 'Standard terms apply',
 *   validUntil: new Date()
 * });
 * const pdfBuffer = doc.output('arraybuffer');
 */
export function createProposalTemplate(data: ProposalData): jsPDF {
  const doc = new jsPDF();
  const { pageWidth, pageHeight, margin, lineHeight, colors, fonts } = TEMPLATE_CONFIG;

  let yPosition = margin;
  let currentPage = 1;

  /**
   * Add page footer with contact info and page number
   */
  const addFooter = () => {
    const footerY = pageHeight - margin + 5;
    doc.setFontSize(fonts.small);
    doc.setTextColor(...colors.secondary);
    doc.setFont('helvetica', 'normal');

    // Contact info (left)
    doc.text('Sunny Stack | sunny-stack.com | luka@sunny-stack.com', margin, footerY);

    // Page number (right)
    const pageText = `Page ${currentPage}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - margin - pageTextWidth, footerY);

    doc.setTextColor(...colors.text);
  };

  /**
   * Add text with word wrap and page break handling
   */
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    color: [number, number, number] = colors.text
  ) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(text, maxWidth);

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin - 10) {
        addFooter();
        doc.addPage();
        currentPage++;
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  /**
   * Add section separator line
   */
  const addSeparator = () => {
    yPosition += 2;
    doc.setDrawColor(...colors.lightGray);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  /**
   * Add section heading
   */
  const addHeading = (text: string) => {
    yPosition += 3;
    addText(text, fonts.heading, true, colors.primary);
    yPosition += 2;
    addSeparator();
  };

  // ============================================================================
  // COVER PAGE
  // ============================================================================

  // Company logo placeholder (text for now)
  doc.setFontSize(fonts.title);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  const logoText = 'SUNNY STACK';
  const logoWidth = doc.getTextWidth(logoText);
  doc.text(logoText, (pageWidth - logoWidth) / 2, yPosition + 10);
  yPosition += 20;

  // Proposal title
  doc.setFontSize(fonts.heading);
  doc.setTextColor(...colors.text);
  const proposalTitle = 'PROJECT PROPOSAL';
  const titleWidth = doc.getTextWidth(proposalTitle);
  doc.text(proposalTitle, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 15;

  // Project title
  doc.setFontSize(fonts.heading);
  doc.setFont('helvetica', 'bold');
  const projectTitleLines = doc.splitTextToSize(data.projectTitle, pageWidth - 2 * margin);
  projectTitleLines.forEach((line: string) => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, (pageWidth - lineWidth) / 2, yPosition);
    yPosition += 8;
  });
  yPosition += 10;

  // Prepared for
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text('Prepared for:', margin, yPosition);
  yPosition += 6;

  doc.setFontSize(fonts.subheading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);
  doc.text(data.clientName, margin, yPosition);
  yPosition += 6;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text(data.clientEmail, margin, yPosition);
  yPosition += 15;

  // Date and validity
  doc.setFontSize(fonts.body);
  doc.setTextColor(...colors.text);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Date: ${today}`, margin, yPosition);
  yPosition += 6;

  const validUntilText = data.validUntil.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Valid Until: ${validUntilText}`, margin, yPosition);
  yPosition += 20;

  // Add footer to cover page
  addFooter();

  // ============================================================================
  // PAGE 2: PROJECT SCOPE
  // ============================================================================

  doc.addPage();
  currentPage++;
  yPosition = margin + 10;

  addHeading('PROJECT OVERVIEW');
  yPosition += 2;

  // Client information
  doc.setFontSize(fonts.subheading);
  doc.setFont('helvetica', 'bold');
  doc.text('Client Information', margin, yPosition);
  yPosition += 6;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.clientName}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Email: ${data.clientEmail}`, margin, yPosition);
  yPosition += 10;

  // Project description
  doc.setFontSize(fonts.subheading);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Description', margin, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fonts.body);
  addText(data.projectDescription, fonts.body, false);
  yPosition += 5;

  // Timeline
  addHeading('PROJECT TIMELINE');
  yPosition += 2;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  addText(`Estimated Timeline: ${data.timeline}`, fonts.body, false);
  yPosition += 10;

  // ============================================================================
  // PAGE 3: BUDGET BREAKDOWN
  // ============================================================================

  addHeading('BUDGET BREAKDOWN');
  yPosition += 5;

  // Budget table header
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin, yPosition);
  doc.text('Amount', pageWidth - margin - 30, yPosition, { align: 'right' });
  yPosition += 2;

  // Header underline
  doc.setDrawColor(...colors.lightGray);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Budget items
  doc.setFont('helvetica', 'normal');
  data.budget.items.forEach((item) => {
    if (yPosition > pageHeight - margin - 20) {
      addFooter();
      doc.addPage();
      currentPage++;
      yPosition = margin;
    }

    doc.text(item.description, margin, yPosition);
    doc.text(`$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, pageWidth - margin - 10, yPosition, {
      align: 'right',
    });
    yPosition += 6;
  });

  // Total line
  yPosition += 2;
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Total amount
  doc.setFontSize(fonts.subheading);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', margin, yPosition);
  doc.text(
    `$${data.budget.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    pageWidth - margin - 10,
    yPosition,
    { align: 'right' }
  );
  yPosition += 15;

  // ============================================================================
  // TERMS & CONDITIONS
  // ============================================================================

  addHeading('TERMS & CONDITIONS');
  yPosition += 2;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  addText(data.terms, fonts.body, false);
  yPosition += 15;

  // ============================================================================
  // SIGNATURE SECTION
  // ============================================================================

  // Check if we need a new page for signature
  if (yPosition > pageHeight - 80) {
    addFooter();
    doc.addPage();
    currentPage++;
    yPosition = margin;
  }

  addHeading('AGREEMENT');
  yPosition += 5;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  addText(
    'By signing below, both parties agree to the terms and conditions outlined in this proposal.',
    fonts.body,
    false
  );
  yPosition += 15;

  // Client signature
  doc.text('Client Signature:', margin, yPosition);
  yPosition += 2;
  doc.line(margin, yPosition, margin + 70, yPosition);
  yPosition += 8;
  doc.text(`Name: ${data.clientName}`, margin, yPosition);
  yPosition += 6;
  doc.text('Date: _________________', margin, yPosition);
  yPosition += 20;

  // Contractor signature
  doc.text('Sunny Stack Representative:', margin, yPosition);
  yPosition += 2;
  doc.line(margin, yPosition, margin + 70, yPosition);
  yPosition += 8;
  doc.text('Name: Luka Fagundes', margin, yPosition);
  yPosition += 6;
  doc.text('Date: _________________', margin, yPosition);

  // Add footer to last page
  addFooter();

  return doc;
}
