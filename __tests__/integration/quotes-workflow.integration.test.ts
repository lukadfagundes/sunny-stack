/**
 * @file Quotes workflow integration tests
 * @description Tests complete quote management workflow including conversion to projects
 * @jest-environment node
 */

// IMPORTANT: Unmock Prisma for integration tests - we need real DB access
jest.unmock("@prisma/client");

// Route the app's prisma singleton through testPrisma so convertQuoteToProject
// uses the same real DB client as the rest of the integration tests
import { testPrisma } from "../helpers/test-db";
jest.mock("@/lib/db/prisma", () => ({
  prisma: testPrisma,
  default: testPrisma,
}));

import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
} from "../helpers/test-db";
import { createTestQuote, createTestProject } from "../helpers/test-factories";
import { QuoteStatus, ProjectStatus } from "@prisma/client";
import {
  convertQuoteToProject,
  canConvertQuote,
} from "@/lib/admin/quote-conversion";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

// Mock logger
jest.mock("@/lib/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Quotes Workflow Integration", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean all data before each test (handles FK ordering correctly)
    await cleanDatabase();
  });

  describe("Create Quote", () => {
    it("should create quote with all required fields", async () => {
      // ACT
      const quote = await createTestQuote({
        name: "John Doe",
        email: "john@example.com",
        projectType: "Web Application",
        description: "Need a web app",
      });

      // ASSERT
      expect(quote).toBeDefined();
      expect(quote.id).toBeDefined();
      expect(quote.name).toBe("John Doe");
      expect(quote.email).toBe("john@example.com");
      expect(quote.projectType).toBe("Web Application");
      expect(quote.description).toBe("Need a web app");
      expect(quote.status).toBe(QuoteStatus.PENDING);
      expect(quote.projectId).toBeNull();
    });

    it("should create quote with all optional fields", async () => {
      // ACT
      const quote = await createTestQuote({
        name: "Jane Smith",
        email: "jane@example.com",
        company: "Tech Corp",
        projectType: "Mobile App",
        budgetRange: "25k-50k",
        timeline: "6 months",
        description: "Mobile application for iOS and Android",
        requirements: "User authentication, push notifications, offline mode",
      });

      // ASSERT
      expect(quote.company).toBe("Tech Corp");
      expect(quote.budgetRange).toBe("25k-50k");
      expect(quote.timeline).toBe("6 months");
      expect(quote.requirements).toBe(
        "User authentication, push notifications, offline mode",
      );
    });

    it("should create multiple quotes", async () => {
      // ACT
      const quote1 = await createTestQuote({ email: "client1@example.com" });
      const quote2 = await createTestQuote({ email: "client2@example.com" });
      const quote3 = await createTestQuote({ email: "client3@example.com" });

      // ASSERT
      expect(quote1.id).not.toBe(quote2.id);
      expect(quote2.id).not.toBe(quote3.id);
      expect(quote1.email).toBe("client1@example.com");
      expect(quote2.email).toBe("client2@example.com");
      expect(quote3.email).toBe("client3@example.com");
    });
  });

  describe("List Quotes", () => {
    it("should list all quotes", async () => {
      // ARRANGE
      await createTestQuote({ name: "Client A" });
      await createTestQuote({ name: "Client B" });
      await createTestQuote({ name: "Client C" });

      // ACT
      const quotes = await testPrisma.quote.findMany();

      // ASSERT
      expect(quotes).toHaveLength(3);
      expect(quotes.map((q) => q.name)).toContain("Client A");
      expect(quotes.map((q) => q.name)).toContain("Client B");
      expect(quotes.map((q) => q.name)).toContain("Client C");
    });

    it("should filter quotes by status", async () => {
      // ARRANGE
      await createTestQuote({ name: "Pending", status: QuoteStatus.PENDING });
      await createTestQuote({ name: "Approved", status: QuoteStatus.APPROVED });
      await createTestQuote({ name: "Declined", status: QuoteStatus.DECLINED });

      // ACT
      const pendingQuotes = await testPrisma.quote.findMany({
        where: { status: QuoteStatus.PENDING },
      });

      // ASSERT
      expect(pendingQuotes).toHaveLength(1);
      expect(pendingQuotes[0].name).toBe("Pending");
    });

    it("should include related project data", async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });

      // ACT
      const quoteWithProject = await testPrisma.quote.findUnique({
        where: { id: quote.id },
        include: { project: true },
      });

      // ASSERT
      expect(quoteWithProject).toBeDefined();
      expect(quoteWithProject?.project).toBeDefined();
      expect(quoteWithProject?.project?.id).toBe(project.id);
    });
  });

  describe("Update Quote Status", () => {
    it("should update quote status from PENDING to APPROVED", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.PENDING });

      // ACT
      const updated = await testPrisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.APPROVED, reviewedAt: new Date() },
      });

      // ASSERT
      expect(updated.status).toBe(QuoteStatus.APPROVED);
      expect(updated.reviewedAt).not.toBeNull();
      expect(updated.reviewedAt).toBeInstanceOf(Date);
    });

    it("should update quote status from PENDING to DECLINED", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.PENDING });

      // ACT
      const updated = await testPrisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.DECLINED, reviewedAt: new Date() },
      });

      // ASSERT
      expect(updated.status).toBe(QuoteStatus.DECLINED);
      expect(updated.reviewedAt).not.toBeNull();
    });

    it("should track reviewedAt timestamp", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.PENDING });
      expect(quote.reviewedAt).toBeNull();

      // ACT
      const reviewed = await testPrisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.APPROVED, reviewedAt: new Date() },
      });

      // ASSERT
      expect(reviewed.reviewedAt).not.toBeNull();
      expect(reviewed.reviewedAt).toBeInstanceOf(Date);
    });
  });

  describe("Convert Quote to Project", () => {
    it("should convert PENDING quote to project atomically", async () => {
      // ARRANGE
      const quote = await createTestQuote({
        name: "John Doe",
        email: "john@example.com",
        projectType: "E-commerce Website",
        description: "Need an online store",
        status: QuoteStatus.PENDING,
      });

      // ACT
      const result = await convertQuoteToProject(quote.id);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.quote).toBeDefined();

      expect(result.project.title).toBe("E-commerce Website");
      expect(result.project.description).toBe("Need an online store");
      expect(result.project.clientName).toBe("John Doe");
      expect(result.project.clientEmail).toBe("john@example.com");
      expect(result.project.status).toBe(ProjectStatus.PLANNING);

      expect(result.quote.status).toBe(QuoteStatus.CONVERTED);
      expect(result.quote.projectId).toBe(result.project.id);
      expect(result.quote.reviewedAt).not.toBeNull();
    });

    it("should throw NotFoundError for non-existent quote", async () => {
      // ACT & ASSERT
      await expect(convertQuoteToProject("nonexistent_id")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should throw ValidationError for already CONVERTED quote", async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({
        status: QuoteStatus.CONVERTED,
        projectId: project.id,
      });

      // ACT & ASSERT
      await expect(convertQuoteToProject(quote.id)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should allow converting APPROVED quote", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.APPROVED });

      // ACT
      const result = await convertQuoteToProject(quote.id);

      // ASSERT - APPROVED quotes are convertible per current business logic
      expect(result.project).toBeDefined();
      expect(result.quote.status).toBe(QuoteStatus.CONVERTED);
    });

    it("should throw ValidationError for DECLINED quote", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.DECLINED });

      // ACT & ASSERT
      await expect(convertQuoteToProject(quote.id)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should maintain transaction atomicity on failure", async () => {
      // ARRANGE: Create a PENDING quote in the real database
      const quote = await createTestQuote({ status: QuoteStatus.PENDING });

      // Spy on $transaction and make it reject once to simulate a DB failure.
      // Because @/lib/db/prisma is mocked to export testPrisma, this spy
      // intercepts the exact $transaction call that convertQuoteToProject makes.
      const transactionSpy = jest
        .spyOn(testPrisma, "$transaction")
        .mockRejectedValueOnce(new Error("Database error"));

      // ACT & ASSERT: The conversion should fail
      await expect(convertQuoteToProject(quote.id)).rejects.toThrow(
        "Database error",
      );

      // Restore original $transaction for subsequent queries
      transactionSpy.mockRestore();

      // ASSERT: Quote status unchanged (transaction rolled back)
      const unchangedQuote = await testPrisma.quote.findUnique({
        where: { id: quote.id },
      });
      expect(unchangedQuote?.status).toBe(QuoteStatus.PENDING);
      expect(unchangedQuote?.projectId).toBeNull();

      // ASSERT: No project was created
      const projects = await testPrisma.project.findMany();
      expect(projects).toHaveLength(0);
    });
  });

  describe("Check Quote Convertibility", () => {
    it("should return true for PENDING quote", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.PENDING });

      // ACT
      const canConvert = await canConvertQuote(quote.id);

      // ASSERT
      expect(canConvert).toBe(true);
    });

    it("should return false for CONVERTED quote", async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({
        status: QuoteStatus.CONVERTED,
        projectId: project.id,
      });

      // ACT
      const canConvert = await canConvertQuote(quote.id);

      // ASSERT
      expect(canConvert).toBe(false);
    });

    it("should return true for APPROVED quote", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.APPROVED });

      // ACT
      const canConvert = await canConvertQuote(quote.id);

      // ASSERT - APPROVED quotes are convertible per current business logic
      expect(canConvert).toBe(true);
    });

    it("should return false for DECLINED quote", async () => {
      // ARRANGE
      const quote = await createTestQuote({ status: QuoteStatus.DECLINED });

      // ACT
      const canConvert = await canConvertQuote(quote.id);

      // ASSERT
      expect(canConvert).toBe(false);
    });

    it("should return false for non-existent quote", async () => {
      // ACT
      const canConvert = await canConvertQuote("nonexistent_id");

      // ASSERT
      expect(canConvert).toBe(false);
    });
  });

  describe("Quote Sorting and Filtering", () => {
    it("should sort quotes by createdAt descending", async () => {
      // ARRANGE
      const quote1 = await createTestQuote({ name: "First" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const quote2 = await createTestQuote({ name: "Second" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const quote3 = await createTestQuote({ name: "Third" });

      // ACT
      const quotes = await testPrisma.quote.findMany({
        orderBy: { createdAt: "desc" },
      });

      // ASSERT
      expect(quotes[0].name).toBe("Third");
      expect(quotes[1].name).toBe("Second");
      expect(quotes[2].name).toBe("First");
    });

    it("should filter quotes by email", async () => {
      // ARRANGE
      await createTestQuote({ email: "client1@example.com" });
      await createTestQuote({ email: "client2@example.com" });
      await createTestQuote({ email: "client1@example.com" });

      // ACT
      const client1Quotes = await testPrisma.quote.findMany({
        where: { email: "client1@example.com" },
      });

      // ASSERT
      expect(client1Quotes).toHaveLength(2);
    });

    it("should paginate quotes", async () => {
      // ARRANGE
      for (let i = 1; i <= 20; i++) {
        await createTestQuote({ name: `Client ${i}` });
      }

      // ACT
      const page1 = await testPrisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });

      const page2 = await testPrisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 10,
      });

      // ASSERT
      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe("Quote Aggregation and Counting", () => {
    it("should count quotes by status", async () => {
      // ARRANGE
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.PENDING });
      await createTestQuote({ status: QuoteStatus.APPROVED });
      await createTestQuote({ status: QuoteStatus.DECLINED });

      // ACT
      const pendingCount = await testPrisma.quote.count({
        where: { status: QuoteStatus.PENDING },
      });

      const approvedCount = await testPrisma.quote.count({
        where: { status: QuoteStatus.APPROVED },
      });

      const declinedCount = await testPrisma.quote.count({
        where: { status: QuoteStatus.DECLINED },
      });

      // ASSERT
      expect(pendingCount).toBe(2);
      expect(approvedCount).toBe(1);
      expect(declinedCount).toBe(1);
    });

    it("should count total quotes", async () => {
      // ARRANGE
      await createTestQuote();
      await createTestQuote();
      await createTestQuote();

      // ACT
      const total = await testPrisma.quote.count();

      // ASSERT
      expect(total).toBe(3);
    });
  });

  describe("Delete Quote", () => {
    it("should delete quote", async () => {
      // ARRANGE
      const quote = await createTestQuote();

      // ACT
      await testPrisma.quote.delete({ where: { id: quote.id } });

      // ASSERT
      const found = await testPrisma.quote.findUnique({
        where: { id: quote.id },
      });
      expect(found).toBeNull();
    });

    it("should cascade delete related proposals", async () => {
      // ARRANGE
      const project = await createTestProject();
      const quote = await createTestQuote({ projectId: project.id });
      const proposal = await testPrisma.proposal.create({
        data: {
          quoteId: quote.id,
          projectId: project.id,
          pdfUrl: "data:application/pdf;base64,test",
        },
      });

      // ACT
      await testPrisma.quote.delete({ where: { id: quote.id } });

      // ASSERT
      const foundProposal = await testPrisma.proposal.findUnique({
        where: { id: proposal.id },
      });
      expect(foundProposal).toBeNull();
    });
  });
});
