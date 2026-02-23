/**
 * @file Tests for quote conversion transaction logic
 * @description Unit tests for atomic quote-to-project conversion
 */

import {
  convertQuoteToProject,
  canConvertQuote,
} from "@/lib/admin/quote-conversion";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { QuoteStatus, ProjectStatus } from "@prisma/client";

// Mock Prisma client
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
    quote: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock logger to prevent console output during tests
jest.mock("@/lib/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe("quote-conversion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("convertQuoteToProject", () => {
    const mockQuote = {
      id: "quote_123",
      name: "John Doe",
      email: "john@example.com",
      company: "Acme Corp",
      projectType: "Web Application",
      budgetRange: "10k-25k",
      timeline: "3 months",
      description: "A new web application",
      requirements: "User auth, dashboard",
      status: QuoteStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      projectId: null,
      reviewedAt: null,
    };

    const mockProject = {
      id: "project_456",
      title: "Web Application",
      description: "A new web application",
      clientName: "John Doe",
      clientEmail: "john@example.com",
      status: ProjectStatus.PLANNING,
      budget: null,
      deadline: null,
      googleDriveFolderId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test("should convert quote to project successfully", async () => {
      // ARRANGE: Mock transaction success
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(mockQuote),
            update: jest.fn().mockResolvedValue({
              ...mockQuote,
              status: QuoteStatus.CONVERTED,
              projectId: mockProject.id,
              reviewedAt: expect.any(Date),
            }),
          },
          project: {
            create: jest.fn().mockResolvedValue(mockProject),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT: Convert quote
      const result = await convertQuoteToProject("quote_123");

      // ASSERT: Verify result
      expect(result).toHaveProperty("project");
      expect(result).toHaveProperty("quote");
      expect(result.project.id).toBe("project_456");
      expect(result.quote.status).toBe(QuoteStatus.CONVERTED);
      expect(result.quote.projectId).toBe("project_456");
    });

    test("should throw NotFoundError when quote does not exist", async () => {
      // ARRANGE: Mock quote not found
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT & ASSERT: Expect error
      await expect(convertQuoteToProject("nonexistent_quote")).rejects.toThrow(
        NotFoundError,
      );
    });

    test("should throw ValidationError when quote status is not PENDING", async () => {
      // ARRANGE: Mock quote with CONVERTED status
      const convertedQuote = { ...mockQuote, status: QuoteStatus.CONVERTED };
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(convertedQuote),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT & ASSERT: Expect validation error
      await expect(convertQuoteToProject("quote_123")).rejects.toThrow(
        ValidationError,
      );
    });

    test("should allow converting APPROVED quote", async () => {
      // ARRANGE: Mock quote with APPROVED status
      const approvedQuote = { ...mockQuote, status: QuoteStatus.APPROVED };
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(approvedQuote),
            update: jest.fn().mockResolvedValue({
              ...approvedQuote,
              status: QuoteStatus.CONVERTED,
              projectId: mockProject.id,
              reviewedAt: new Date(),
            }),
          },
          project: {
            create: jest.fn().mockResolvedValue(mockProject),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT & ASSERT: APPROVED quotes are convertible per current business logic
      const result = await convertQuoteToProject("quote_123");
      expect(result.project).toBeDefined();
      expect(result.quote.status).toBe(QuoteStatus.CONVERTED);
    });

    test("should throw ValidationError when quote status is DECLINED", async () => {
      // ARRANGE: Mock quote with DECLINED status
      const declinedQuote = { ...mockQuote, status: QuoteStatus.DECLINED };
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(declinedQuote),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT & ASSERT: Expect validation error
      await expect(convertQuoteToProject("quote_123")).rejects.toThrow(
        ValidationError,
      );
    });

    test("should rollback transaction on error", async () => {
      // ARRANGE: Mock transaction that fails during project creation
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(mockQuote),
          },
          project: {
            create: jest.fn().mockRejectedValue(new Error("Database error")),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT & ASSERT: Transaction should fail and rollback
      await expect(convertQuoteToProject("quote_123")).rejects.toThrow(
        "Database error",
      );
    });

    test("should set reviewedAt timestamp when converting", async () => {
      // ARRANGE: Mock transaction
      let capturedReviewedAt: Date | null = null;

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(mockQuote),
            update: jest.fn().mockImplementation((params) => {
              capturedReviewedAt = params.data.reviewedAt;
              return Promise.resolve({
                ...mockQuote,
                status: QuoteStatus.CONVERTED,
                projectId: mockProject.id,
                reviewedAt: capturedReviewedAt,
              });
            }),
          },
          project: {
            create: jest.fn().mockResolvedValue(mockProject),
          },
        };
        return callback(mockTx);
      });

      (prisma.$transaction as jest.Mock) = mockTransaction;

      // ACT: Convert quote
      await convertQuoteToProject("quote_123");

      // ASSERT: reviewedAt should be set
      expect(capturedReviewedAt).toBeInstanceOf(Date);
    });
  });

  describe("canConvertQuote", () => {
    test("should return true for PENDING quote", async () => {
      // ARRANGE: Mock PENDING quote
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
        status: QuoteStatus.PENDING,
      });

      // ACT: Check if can convert
      const result = await canConvertQuote("quote_123");

      // ASSERT: Should return true
      expect(result).toBe(true);
    });

    test("should return false for CONVERTED quote", async () => {
      // ARRANGE: Mock CONVERTED quote
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
        status: QuoteStatus.CONVERTED,
      });

      // ACT: Check if can convert
      const result = await canConvertQuote("quote_123");

      // ASSERT: Should return false
      expect(result).toBe(false);
    });

    test("should return true for APPROVED quote", async () => {
      // ARRANGE: Mock APPROVED quote
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
        status: QuoteStatus.APPROVED,
      });

      // ACT: Check if can convert
      const result = await canConvertQuote("quote_123");

      // ASSERT: APPROVED quotes are convertible per current business logic
      expect(result).toBe(true);
    });

    test("should return false for DECLINED quote", async () => {
      // ARRANGE: Mock DECLINED quote
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue({
        status: QuoteStatus.DECLINED,
      });

      // ACT: Check if can convert
      const result = await canConvertQuote("quote_123");

      // ASSERT: Should return false
      expect(result).toBe(false);
    });

    test("should return false when quote does not exist", async () => {
      // ARRANGE: Mock quote not found
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue(null);

      // ACT: Check if can convert
      const result = await canConvertQuote("nonexistent_quote");

      // ASSERT: Should return false
      expect(result).toBe(false);
    });

    test("should return false on database error", async () => {
      // ARRANGE: Mock database error
      (prisma.quote.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database connection failed"),
      );

      // ACT: Check if can convert
      const result = await canConvertQuote("quote_123");

      // ASSERT: Should return false (graceful failure)
      expect(result).toBe(false);
    });
  });
});
