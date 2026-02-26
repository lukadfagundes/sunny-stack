/**
 * @jest-environment node
 */

// __tests__/unit/lib/pdf/pdf-generator.test.ts

// Mock prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    quote: {
      findUnique: jest.fn(),
    },
    proposal: {
      create: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("@/lib/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock proposal-template
jest.mock("@/lib/pdf/proposal-template", () => {
  const outputFn = jest.fn().mockReturnValue(new ArrayBuffer(100));
  return {
    createProposalTemplate: jest.fn().mockReturnValue({
      output: outputFn,
    }),
    __mockOutput: outputFn,
  };
});

import {
  transformQuoteToProposalData,
  generateProposalPDF,
  saveProposalToDatabase,
  generateAndSaveProposal,
} from "@/lib/pdf/pdf-generator";
import { NotFoundError } from "@/lib/errors/app-error";

// Retrieve mock references created inside the factories
const { prisma: mockPrisma } = jest.requireMock("@/lib/db/prisma") as {
  prisma: {
    quote: { findUnique: jest.Mock };
    proposal: { create: jest.Mock };
  };
};
const mockPrismaQuote = mockPrisma.quote;
const mockPrismaProposal = mockPrisma.proposal;
const { __mockOutput: mockOutput } = jest.requireMock(
  "@/lib/pdf/proposal-template",
) as {
  __mockOutput: jest.Mock;
};

describe("pdf-generator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================================
  // transformQuoteToProposalData
  // =====================================================================
  describe("transformQuoteToProposalData", () => {
    const baseQuote = {
      id: "quote-1",
      name: "John Doe",
      email: "john@example.com",
      projectType: "webapp",
      description: "Build a web app",
      timeline: "3 months",
      budgetRange: "$10,000",
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    test("maps quote fields to proposal data", () => {
      const result = transformQuoteToProposalData(baseQuote);

      expect(result.clientName).toBe("John Doe");
      expect(result.clientEmail).toBe("john@example.com");
      expect(result.projectTitle).toBe("webapp");
      expect(result.projectDescription).toBe("Build a web app");
      expect(result.timeline).toBe("3 months");
    });

    test("parses budget from dollar amount string", () => {
      const result = transformQuoteToProposalData(baseQuote);

      expect(result.budget.total).toBe(10000);
      expect(result.budget.items).toHaveLength(1);
      expect(result.budget.items[0].description).toBe("Project Development");
      expect(result.budget.items[0].amount).toBe(10000);
    });

    test("handles range budget format", () => {
      const quote = { ...baseQuote, budgetRange: "5000-10000" };
      const result = transformQuoteToProposalData(quote);

      expect(result.budget.total).toBe(7500);
    });

    test('handles "k" format in budget range', () => {
      const quote = { ...baseQuote, budgetRange: "5k-10k" };
      const result = transformQuoteToProposalData(quote);

      expect(result.budget.total).toBe(7500);
    });

    test("handles null budgetRange", () => {
      const quote = { ...baseQuote, budgetRange: null };
      const result = transformQuoteToProposalData(quote);

      expect(result.budget.total).toBe(0);
    });

    test("handles null description", () => {
      const quote = { ...baseQuote, description: null };
      const result = transformQuoteToProposalData(quote);

      expect(result.projectDescription).toBe("No description provided");
    });

    test("handles null projectType", () => {
      const quote = { ...baseQuote, projectType: null };
      const result = transformQuoteToProposalData(quote);

      expect(result.projectTitle).toBe("Project for John Doe");
    });

    test("handles null timeline", () => {
      const quote = { ...baseQuote, timeline: null };
      const result = transformQuoteToProposalData(quote);

      expect(result.timeline).toBe("To be determined");
    });

    test("sets validUntil to 30 days from now", () => {
      const now = Date.now();
      const result = transformQuoteToProposalData(baseQuote);
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      expect(result.validUntil.getTime()).toBeGreaterThanOrEqual(
        now + thirtyDaysMs - 1000,
      );
      expect(result.validUntil.getTime()).toBeLessThanOrEqual(
        now + thirtyDaysMs + 1000,
      );
    });

    test("includes standard payment terms", () => {
      const result = transformQuoteToProposalData(baseQuote);

      expect(result.terms).toContain("50% upfront");
      expect(result.terms).toContain("50% upon completion");
    });

    test('handles "Under" budget format', () => {
      const quote = { ...baseQuote, budgetRange: "Under $5,000" };
      const result = transformQuoteToProposalData(quote);

      expect(result.budget.total).toBe(5000);
    });
  });

  // =====================================================================
  // generateProposalPDF
  // =====================================================================
  describe("generateProposalPDF", () => {
    const proposalData = {
      clientName: "John Doe",
      clientEmail: "john@example.com",
      projectTitle: "Web App",
      projectDescription: "Build a web app",
      timeline: "3 months",
      budget: { items: [{ description: "Dev", amount: 10000 }], total: 10000 },
      terms: "Standard terms",
      validUntil: new Date("2026-04-01"),
    };

    test("returns a Buffer", async () => {
      const result = await generateProposalPDF(proposalData);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    test("calls createProposalTemplate with data", async () => {
      const { createProposalTemplate } = require("@/lib/pdf/proposal-template");

      await generateProposalPDF(proposalData);

      expect(createProposalTemplate).toHaveBeenCalledWith(proposalData);
    });

    test("calls doc.output with arraybuffer format", async () => {
      await generateProposalPDF(proposalData);

      expect(mockOutput).toHaveBeenCalledWith("arraybuffer");
    });

    test("propagates errors from template creation", async () => {
      const { createProposalTemplate } = require("@/lib/pdf/proposal-template");
      createProposalTemplate.mockImplementationOnce(() => {
        throw new Error("Template error");
      });

      await expect(generateProposalPDF(proposalData)).rejects.toThrow(
        "Template error",
      );
    });
  });

  // =====================================================================
  // saveProposalToDatabase
  // =====================================================================
  describe("saveProposalToDatabase", () => {
    test("saves proposal with base64 PDF data URL", async () => {
      mockPrismaQuote.findUnique.mockResolvedValue({ id: "quote-1" });
      mockPrismaProposal.create.mockResolvedValue({
        id: "proposal-1",
        quoteId: "quote-1",
        projectId: "project-1",
        pdfUrl: "data:application/pdf;base64,abc",
        sentAt: null,
      });

      const pdfBuffer = Buffer.from("pdf-content");
      const result = await saveProposalToDatabase(
        "quote-1",
        "project-1",
        pdfBuffer,
      );

      expect(result.id).toBe("proposal-1");
      expect(mockPrismaProposal.create).toHaveBeenCalledWith({
        data: {
          quoteId: "quote-1",
          projectId: "project-1",
          pdfUrl: expect.stringContaining("data:application/pdf;base64,"),
          sentAt: null,
        },
      });
    });

    test("throws NotFoundError when quote does not exist", async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(null);

      const pdfBuffer = Buffer.from("pdf-content");
      await expect(
        saveProposalToDatabase("nonexistent", "project-1", pdfBuffer),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // =====================================================================
  // generateAndSaveProposal
  // =====================================================================
  describe("generateAndSaveProposal", () => {
    test("fetches quote, generates PDF, and saves proposal", async () => {
      const mockQuote = {
        id: "quote-1",
        name: "Jane Smith",
        email: "jane@example.com",
        projectType: "website",
        description: "Build a website",
        timeline: "1 month",
        budgetRange: "$5,000",
      };

      mockPrismaQuote.findUnique
        .mockResolvedValueOnce(mockQuote) // First call in generateAndSaveProposal
        .mockResolvedValueOnce(mockQuote); // Second call in saveProposalToDatabase

      mockPrismaProposal.create.mockResolvedValue({
        id: "proposal-2",
        quoteId: "quote-1",
        projectId: "project-1",
        pdfUrl: "data:application/pdf;base64,xyz",
        sentAt: null,
      });

      const result = await generateAndSaveProposal("quote-1", "project-1");

      expect(result.id).toBe("proposal-2");
      expect(mockPrismaQuote.findUnique).toHaveBeenCalledWith({
        where: { id: "quote-1" },
      });
    });

    test("throws NotFoundError when quote does not exist", async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(null);

      await expect(
        generateAndSaveProposal("nonexistent", "project-1"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
